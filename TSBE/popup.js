document.getElementById("check-btn").addEventListener("click", () => {
  // Get the active tab's URL
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0].url;

    // Send a message to the background script to check trustworthiness
    chrome.runtime.sendMessage(
      { action: "checkTrustworthiness", url },
      (response) => {
        // Get status and detail containers
        const status = document.getElementById("status");
        const detailDiv = document.getElementById("details");
        const scoreButton = document.getElementById("score-btn"); // Button for score color

        if (!response) {
          // Handle case when no response is received
          status.textContent = "Error: Could not evaluate trustworthiness.";
          status.style.color = "red";
          return;
        }

        const { scores, details, totalScore, safe } = response;

        // Update status message with neutral yellow, green, or red
        if (totalScore === 100) {
          status.textContent = "This website is safe!";
          status.style.color = "green"; // Green for 100
        } else if (totalScore >= 75) {
          status.textContent = "This website is safe!";
          status.style.color = "yellow"; // Yellow for 75+ (neutral/caution)
        } else {
          status.textContent = "Warning! This website may not be safe.";
          status.style.color = "red"; // Red for unsafe
        }

        // Display detailed results with scores
        detailDiv.innerHTML = ` 
          <p><strong>SSL Check:</strong> ${details.sslStatus.message} (Score: ${scores.ssl}/25)</p>
          <p><strong>Domain Reputation:</strong> ${details.domainReputation.message} (Score: ${scores.domainReputation}/25)</p>
          <p><strong>Phishing Check:</strong> ${details.phishing.message} (Score: ${scores.phishing}/25)</p>
          <p><strong>Blacklist Check:</strong> ${details.blacklist.message} (Score: ${scores.blacklist}/25)</p>
          <p><strong>Total Score:</strong> ${totalScore}/100</p>
        `;

        // Add color logic for the button based on total score
        if (totalScore === 100) {
          scoreButton.style.backgroundColor = "green"; // Green for 100
          scoreButton.textContent = "Score: 100 - Excellent"; // Optional text change
        } else if (totalScore >= 75) {
          scoreButton.style.backgroundColor = "yellow"; // Yellow for 75+
          scoreButton.textContent = "Score: 75+ - Good"; // Optional text change
        } else if (totalScore >= 50) {
          scoreButton.style.backgroundColor = "red"; // Red for 50+
          scoreButton.textContent = "Score: 50+ - Risky"; // Optional text change
        } else {
          scoreButton.style.backgroundColor = ""; // Default button color (if needed)
          scoreButton.textContent = "Score: Below 50 - Unsafe"; // Optional text change
        }
      }
    );
  });
});