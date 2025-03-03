const { createFFmpeg, fetchFile } = FFmpeg;
document.addEventListener("DOMContentLoaded", () => { //Waits for page to fully load
    const screens = { //References for each screen
        folder: document.getElementById("screen-folder"),
        login: document.getElementById("screen-login"),
        main: document.getElementById("screen-main"),
        settings: document.getElementById("screen-settings")
    };

    function showScreen(screen) { //shows correct screen while hiding others
        Object.values(screens).forEach(s => s.style.display = "none"); //hides all screens
        screens[screen].style.display = "block"; //shows selected screen
    }

    chrome.storage.local.get(["downloadFolder", "spotifyAccessToken", "spotifyTokenExpiration"], (data) => {
        const currentTime = Date.now();
        
        if (!data.downloadFolder) {
            showScreen("folder");
        } else if (!data.spotifyAccessToken || !data.spotifyTokenExpiration || currentTime >= data.spotifyTokenExpiration) {
            console.log("Spotify token missing or expired. Redirecting to login.");
            chrome.storage.local.remove(["spotifyAccessToken", "spotifyTokenExpiration"], () => {
                showScreen("login");
            });
        } else {
            console.log("Spotify token is valid. Fetching user data...");
            showScreen("main");
            fetchSpotifyProfile(data.spotifyAccessToken);
        }
    });

    document.getElementById("set-folder").addEventListener("click", () => {
        const folderInput = document.getElementById("folder-name");
        const folderName = folderInput.value.trim();
        
        if(!folderName) {
            alert("Please enter a valid folder name.");
            return;
        }

        console.log("Folder selected:", folderName);

        chrome.storage.local.set({ downloadFolder: folderName }, () => {
            chrome.storage.local.get(["spotifyAccessToken", "spotifyTokenExpiration"], (data) => {
                const currentTime = Date.now();
                if (data.spotifyAccessToken && data.spotifyTokenExpiration && currentTime < data.spotifyTokenExpiration) { 
                    console.log("Already logged in to Spotify. Skipping login.");
                    showScreen("main");
                } else {
                    console.log("Not logged in to Spotify or token expired. Redirecting to login.");
                    chrome.storage.local.remove(["spotifyAccessToken", "spotifyTokenExpiration"], () => {
                        showScreen("login");
                    });
                }
            });
        });
    });

    document.getElementById("change-folder").addEventListener("click", () => {
        console.log("Removing saved download folder...");
        chrome.storage.local.remove("downloadFolder", () => {
            console.log("Download folder removed.");
            showScreen("folder");
        })
    })

    document.getElementById("login-spotify").addEventListener("click", () => { //once spotify login is completed, preference stored in chrome cloud and moves onto main screen
        const clientId = CLIENT_ID; //CLIENT_ID is user sided. Since extension isn't public, this will vary between each user.
        const redirectUri = `chrome-extension://${chrome.runtime.id}/callback.html`; //extension id
        const scope = "user-library-read"; //permissions

        const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
        
        console.log("Opening Spotify login:", authUrl); //debugging log

        chrome.tabs.create({url: authUrl}); //redirect users to login
    });

    document.getElementById("logout-spotify").addEventListener("click", () => {
        console.log("Logging out of spotify...");
        chrome.storage.local.remove("spotifyAccessToken", () => {
            console.log("Spotify token removed.")

            const clientId = "1438006dadf84cb6824ddab91f93c586";
            const redirectUri = `chrome-extension://${chrome.runtime.id}/callback.html`; // Correct redirect URI
            const authUrl = `https://accounts.spotify.com/logout`; // Spotify's logout URL
            chrome.tabs.create({ url: authUrl });

            showScreen("login");
        });
    });

    function fetchSpotifyProfile(token) {
        //making api request
        fetch("https://api.spotify.com/v1/me", { //base link
            method: "GET", //method to retrieve data
            headers: {
                "Authorization": `Bearer ${token}` //token
            }
        })
        .then(response => response.json()) //converts response into json format
        .then(user => {
            console.log("Spotify User Data", user);
                
            //gets main screen
            const screenMain = document.getElementById("screen-main");
    
            //display name
            // const displayNameText = document.createElement("p");
            // displayNameText.textContent = `Logged in as: ${user.display_name}`;
            // screenMain.appendChild(displayNameText);
    
            //spotifyID
            // const idText = document.createElement("p");
            // idText.textContent = `Spotify ID: ${user.id}`;
            // screenMain.appendChild(idText);
    
            //create image (if exist)
            const profilePic = document.getElementById("profile-pic");
            if(user.images && user.images.length > 0) {
                profilePic.src = user.images[0].url;
            } else {
                profilePic.src = "default-profile-image.jpg"; //adds default picture
            }

            fetchSpotifyPlaylists(token);
        })
        .catch(error => console.error("Spotify API Request Failed:", error)); //catches any errors
    }

    function fetchSpotifyPlaylists(token) {
        fetch("https://api.spotify.com/v1/me/playlists", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            const playlistList = document.getElementById("playlist-list");
            data.items.forEach(playlist => {
                const listItem = document.createElement("li");
                listItem.classList.add("playlist-item");
    
                //playlist images
                const playlistImage = document.createElement("img");
                playlistImage.src = playlist.images[0] ? playlist.images[0].url : 'default-image.jpg'; // Fallback image if none available
                playlistImage.alt = playlist.name;
    
                //playlist names
                const playlistName = document.createElement("span");
                playlistName.classList.add("playlist-name");
                playlistName.textContent = playlist.name; // Set the playlist name
    
                // playlist checkboxes
                const playlistLabel = document.createElement("label");
                const playlistCheckbox = document.createElement("input");
                playlistCheckbox.type = "checkbox";
                playlistCheckbox.id = `playlist-${playlist.id}`;
    
                //appending checkbox to label
                playlistLabel.appendChild(playlistCheckbox);
    
                //append everything 
                listItem.appendChild(playlistImage);
                listItem.appendChild(playlistName);  //adds name between
                listItem.appendChild(playlistLabel);
                playlistList.appendChild(listItem);
            });
        })
        .catch(error => console.error("Error fetching playlists:", error));
    }
    
    document.getElementById("download-song").addEventListener("click", () => {
        alert("Youtube has patched all MP3 scraping for their videos. Until any solution is available, this function will not be implemented.");
        // const youtubeURL = "https://www.youtube.com/watch?v=m3Xfv_BHct4".trim();
    
        // if(!youtubeURL || !youtubeURL.includes("youtube.com/watch?v=")) {
        //     alert("Please enter a valid Youtube URL");
        //     return;
        // }
        
        // chrome.tabs.create({ url: "https://emp3juice.la/" }, (tab) => {
        //     setTimeout(() => {
        //         chrome.scripting.executeScript({
        //             target: { tabId: tab.id },
        //             function: fillConverterInput,
        //             args: [youtubeURL]
        //         });
        //     }, 3000);
        // });
    });
    
    //Not working due to Youtube patching mp3 converters
    // function fillConverterInput(youtubeURL) {
    //     const inputField = document.querySelector("input#query"); //selector for box (hmtl)
    //     if (inputField) {
    //         inputField.value = ""; //clearing text if any
    
    //         let index = 0;
    //         function typeLetter() {
    //             if (index < youtubeURL.length) {
    //                 const char = youtubeURL[index];
    //                 inputField.value += char;
    
    //                 // Dispatch keyboard events
    //                 const eventOptions = { bubbles: true, cancelable: true, key: char };
    //                 inputField.dispatchEvent(new KeyboardEvent("keydown", eventOptions));
    //                 inputField.dispatchEvent(new KeyboardEvent("keypress", eventOptions));
    //                 inputField.dispatchEvent(new KeyboardEvent("keyup", eventOptions));
    //                 inputField.dispatchEvent(new Event("input", { bubbles: true })); //triggers new event
    
    //                 index++;
    //                 setTimeout(typeLetter, Math.random() * 100 + 50); //simulate typing speed
    //             }
    //         }
    //         typeLetter(); //types
    //     }
    // }

    document.getElementById("settings").addEventListener("click", () => {
        showScreen("settings");
    })
    document.getElementById("exit-settings").addEventListener("click", () => {
        showScreen("main")
    })

});

