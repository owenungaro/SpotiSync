document.addEventListener("DOMContentLoaded", () => {
    console.log("Callback page loaded!");

    //get url fragment
    const params = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = params.get("access_token");

    if(accessToken) {
        console.log("Access Token Retrieved:", accessToken);

        //add to chrome storage
        chrome.storage.local.set({ spotifyAccessToken: accessToken }, () => {
            console.log("Spotify token saved! Redirecting to popup...");
            //redirect
            window.location.href = "popup.html";
        });
    } else {
        console.error("No access token found in URL.");
        document.body.innerHTML = "<p>Failed to login. Please try again.</p>";
    }
});
