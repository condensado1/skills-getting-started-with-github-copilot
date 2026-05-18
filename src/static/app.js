document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select options (keep the placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const participantsHtml = (details.participants && details.participants.length > 0)
          ? `
            <h5 class="participants-title">Participants</h5>
            <ul class="participants">
              ${details.participants.map(p => `<li class="participant-item" data-email="${p}"><span class="participant-email">${p}</span><button class="participant-delete" title="Remove">✖</button></li>`).join("")}
            </ul>
          `
          : `<p class="participant-empty">No participants yet</p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        // Attach delete handlers for participant buttons
        // (attach after inserting into DOM so querySelector works)
        activitiesList.appendChild(activityCard);

        activityCard.querySelectorAll('.participant-delete').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const li = btn.closest('.participant-item');
            const emailToRemove = li.dataset.email;
            const activityName = name;
            try {
              const response = await fetch(
                `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(emailToRemove)}`,
                { method: 'DELETE' }
              );
              const result = await response.json();
              if (response.ok) {
                // remove from DOM
                li.remove();
                // update availability count
                const avail = activityCard.querySelector('.availability');
                if (avail) {
                  const match = avail.textContent.match(/\d+/);
                  const current = match ? parseInt(match[0], 10) : 0;
                  avail.innerHTML = `<strong>Availability:</strong> ${current + 1} spots left`;
                }
                // show success message briefly
                messageDiv.textContent = result.message;
                messageDiv.className = 'success';
                messageDiv.classList.remove('hidden');
                setTimeout(() => messageDiv.classList.add('hidden'), 3000);
              } else {
                messageDiv.textContent = result.detail || 'Failed to remove participant';
                messageDiv.className = 'error';
                messageDiv.classList.remove('hidden');
              }
            } catch (err) {
              messageDiv.textContent = 'Failed to remove participant';
              messageDiv.className = 'error';
              messageDiv.classList.remove('hidden');
              console.error('Error removing participant:', err);
            }
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities to show the new participant without full page reload
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
