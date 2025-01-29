document.addEventListener("DOMContentLoaded", () => { //Waits for page to fully load
    const screens = { //References for each screen
        folder: document.getElementById("screen-folder"),
        login: document.getElementById("screen-login"),
        main: document.getElementById("screen-main")
    };

    function showScreen(screen) { //shows correct screen while hiding others
        Object.values(screens).forEach(s => s.style.display = "none"); //hides all screens
        screens[screen].style.display = "block"; //shows selected screen
    }

    chrome.storage.local.get(["folderSelected", "spotifyAccessToken"], (data) => { //retrieves stored user data to determine what screen to start with
        if(!data.folderSelected) {
            showScreen("folder");
        } else if(!data.spotifyAccessToken) {
            showScreen("login");
        } else {
            showScreen("main");
            fetchSpotifyProfile(data.spotifyAccessToken); //fetches spotify data
        }
    });

    document.getElementById("set-folder").addEventListener("click", () => { //once set folder is completed, preference stored in chrome cloud and moves onto spotify login
        chrome.storage.local.set({folderSelected: true}, () => {
            showScreen("login");
        });
    });

    document.getElementById("login-spotify").addEventListener("click", () => { //once spotify login is completed, preference stored in chrome cloud and moves onto main screen
        const clientId = "1438006dadf84cb6824ddab91f93c586";
        const redirectUri = `chrome-extension://${chrome.runtime.id}/callback.html`; //extension id
        const scope = "user-library-modify"; //permissions

        const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
        
        console.log("Opening Spotify login:", authUrl); //debugging log

        chrome.tabs.create({url: authUrl}); //redirect users to login
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

            //updates main screen with user spotify info
            document.getElementById("screen-main").innerHTML += `
                <p>Logged in as: ${user.display_name}</p>
                <p>Spotify ID: ${user.id}</p>
                ${user.images && user.images.length > 0 ? `<img src="${user.images[0].url}" width="100" />` : "<p>No profile picture available</p>"}`;
        })
        .catch(error => console.error("Spotify API Request Failed:", error)); //catches any errors
    }

});

