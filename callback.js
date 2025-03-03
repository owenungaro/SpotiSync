document.addEventListener("DOMContentLoaded", () => {
    console.log("Callback page loaded!");

    //get url fragment
    const params = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = params.get("access_token");
    const expiresIn = params.get("expires_in"); //1 hr

    if(accessToken && expiresIn) {
        console.log("Access Token Retrieved:", accessToken);

        const expirationTime = Date.now() + parseInt(expiresIn)*1000; //converts expiresIn to miliseconds

        //add to chrome storage
        chrome.storage.local.set({
            spotifyAccessToken: accessToken,
            spotifyTokenExpiration: expirationTime
        }, () => {
            console.log("Spotify token saved. Closing login tab.");
            window.close(); //Closes window and then 500ms later opens popup
            setTimeout(() => {
                window.location.href = "popup.html";
            }, 500);
        });
    } else {
        console.error("No access token found in URL.");
        document.body.innerHTML = "<p>Failed to login. Please try again.</p>";
    }
});
