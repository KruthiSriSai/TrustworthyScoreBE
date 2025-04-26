const WHOIS_API_KEY = "at_BURjKhSX7ndxbwaBvxrZYyGV7WJ3T";
const GOOGLE_API_KEY = "AIzaSyBe7Y4wjxOd6E1-4LmTM8D6wtdoUEHORGg"; // Replace with your Google Safe Browsing API key

// Hardcoded blacklist for demonstration
const BLACKLIST = [
  "http://malicious-example.com",
  "https://phishing-example.org",
  "http://unsafe-site.net"
];

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkTrustworthiness") {
    const url = request.url;

    // Perform all checks
    Promise.all([
      checkSSL(url),
      checkDomainReputation(url),
      checkPhishing(url),
      checkBlacklist(url)
    ]).then((results) => {
      const [sslStatus, domainReputation, phishing, blacklist] = results;

      // Calculate scores
      const scores = {
        ssl: sslStatus.safe ? 25 : 0,
        domainReputation: domainReputation.safe ? 25 : 0,
        phishing: phishing.safe ? 25 : 0,
        blacklist: blacklist.safe ? 25 : 0,
      };

      const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

      sendResponse({
        safe: totalScore === 100,
        scores,
        details: { sslStatus, domainReputation, phishing, blacklist },
        totalScore
      });
    });

    return true; // Keeps the message channel open for async response
  }
});

// SSL Check
async function checkSSL(url) {
  try {
    const protocol = new URL(url).protocol;
    return {
      safe: protocol === "https:",
      message: protocol === "https:" ? "SSL is valid." : "No SSL detected."
    };
  } catch (error) {
    return { safe: false, message: "Error checking SSL." };
  }
}

// Domain Reputation Check (Improved Logic)
async function checkDomainReputation(url) {
  const safeBrowsingEndpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${GOOGLE_API_KEY}`;
  const body = {
    client: {
      clientId: "trustworthiness_extension",
      clientVersion: "1.0"
    },
    threatInfo: {
      threatTypes: ["MALWARE", "SOCIAL_ENGINEERING"],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url: url }]
    }
  };

  try {
    const response = await fetch(safeBrowsingEndpoint, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" }
    });
    const data = await response.json();

    if (data.matches && data.matches.length > 0) {
      return { safe: false, message: "Malware or phishing detected." };
    }

    return { safe: true, message: "No threats detected by Safe Browsing." };
  } catch (error) {
    console.error("Error checking domain reputation:", error);
    return { safe: false, message: "Error checking reputation, possibly due to network issues." };
  }
}

// Phishing Detection (Improved Logic)
async function checkPhishing(url) {
  try {
    const apiUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${GOOGLE_API_KEY}`;
    const requestPayload = {
      client: {
        clientId: "yourCompanyName",
        clientVersion: "1.5.2"
      },
      threatInfo: {
        threatTypes: ["MALWARE", "SOCIAL_ENGINEERING"],
        platformTypes: ["ANY_PLATFORM"],
        threatEntryTypes: ["URL"],
        threatEntries: [{ url }]
      }
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestPayload)
    });

    const data = await response.json();

    if (data.matches && data.matches.length > 0) {
      return { safe: false, message: "Phishing or malware detected by Safe Browsing API." };
    }

    return { safe: true, message: "No phishing patterns detected." };
  } catch (error) {
    return { safe: false, message: `Error checking phishing patterns: ${error.message}` };
  }
}

// Blacklist Check
async function checkBlacklist(url) {
  const isBlacklisted = BLACKLIST.some((blacklistedUrl) => url.includes(blacklistedUrl));

  return {
    safe: !isBlacklisted,
    message: isBlacklisted ? "URL is blacklisted." : "Not in blacklist."
  };
}
