const editModal = document.getElementById("editModal");
const deleteModal = document.getElementById("deleteModal");
const errorModal = document.getElementById("errorModal");

function hideAllModals() {
  if (editModal) editModal.style.display = "none";
  if (deleteModal) deleteModal.style.display = "none";
  if (errorModal) errorModal.style.display = "none";
}

function showErrorModal(message) {
  hideAllModals(); // Hide any other open modals first
  document.getElementById("errorMessageText").textContent = message;
  errorModal.style.display = "block";
}

document
  .getElementById("closeEditModal")
  ?.addEventListener("click", hideAllModals);
document
  .getElementById("cancelEditBtn")
  ?.addEventListener("click", hideAllModals);
document
  .getElementById("closeDeleteModal")
  ?.addEventListener("click", hideAllModals);
document
  .getElementById("cancelDeleteBtn")
  ?.addEventListener("click", hideAllModals);
document
  .getElementById("closeErrorModal")
  ?.addEventListener("click", hideAllModals);
document
  .getElementById("errorModalOkBtn")
  ?.addEventListener("click", hideAllModals);

window.addEventListener("click", (event) => {
  if (
    event.target == editModal ||
    event.target == deleteModal ||
    event.target == errorModal
  ) {
    hideAllModals();
  }
});

const therapistIdElement = document.getElementById("therapistId");
const therapistId = therapistIdElement ? therapistIdElement.value : null;

// Ensure therapistId is available before proceeding
if (!therapistId) {
  console.error(
    "Therapist ID not found on the page. Cannot submit availability."
  );
  showErrorModal("Failed to retrieve therapist ID. Please refresh the page.");
  // Optionally, disable the form or redirect
}

document
  .getElementById("availabilityForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    // Check if therapistId is valid before making the request
    if (!therapistId || isNaN(parseInt(therapistId))) {
      showErrorModal("Invalid therapist ID. Please refresh and try again.");
      return;
    }

    try {
      // Use the JavaScript variable therapistId in the fetch URL
      const response = await fetch(`/api/availability/${therapistId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_timestamp: formData.get("start_timestamp"),
          end_timestamp: formData.get("end_timestamp"),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        window.location.reload();
      } else {
        showErrorModal(data.error || "An unknown error occurred.");
      }
    } catch (error) {
      console.error("Error:", error);
      showErrorModal(
        "An error occurred while adding availability. Please try again."
      );
    }
  });

function editSlot(id) {
  hideAllModals(); // Ensure other modals are closed
  const slotElement = document.querySelector(
    `.availability-slot[data-id="${id}"]`
  );
  if (slotElement) {
    const startTimestamp = slotElement.dataset.startTimestamp;
    const endTimestamp = slotElement.dataset.endTimestamp;

    document.getElementById("editSlotId").value = id;
    document.getElementById("editStartTimestamp").value = startTimestamp;
    document.getElementById("editEndTimestamp").value = endTimestamp;
    editModal.style.display = "block";
  } else {
    showErrorModal("Could not find the availability slot to edit.");
  }
}

document
  .getElementById("editForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const id = document.getElementById("editSlotId").value; // This `id` is the availability_id

    // Ensure id is valid
    if (!id || isNaN(parseInt(id))) {
      showErrorModal("Invalid availability ID for update.");
      return;
    }

    try {
      const response = await fetch(`/api/availability/${id}`, { // Use the actual availability ID here
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_timestamp: formData.get("start_timestamp"),
          end_timestamp: formData.get("end_timestamp"),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        window.location.reload();
      } else {
        showErrorModal(data.error || "An unknown error occurred.");
      }
    } catch (error) {
      console.error("Error during edit operation:", error);
      showErrorModal(
        "An error occurred while updating availability. Please try again."
      );
    }
  });

// Delete availability (Functions to show modal and perform delete)
let slotToDeleteId = null; // Variable to store the ID of the slot to be deleted

function showDeleteModal(id) {
  hideAllModals(); // Ensure other modals are closed
  slotToDeleteId = id; // Store the ID
  deleteModal.style.display = "block";
}

document
  .getElementById("confirmDeleteBtn")
  .addEventListener("click", async () => {
    if (!slotToDeleteId || isNaN(parseInt(slotToDeleteId))) {
      showErrorModal("No valid slot selected for deletion.");
      return;
    }

    try {
      const response = await fetch(`/api/availability/${slotToDeleteId}`, { // Use the actual availability ID here
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (response.ok) {
        window.location.reload();
      } else {
        showErrorModal(
          data.error || "An unknown error occurred during deletion."
        );
      }
    } catch (error) {
      console.error("Error during delete operation:", error);
      showErrorModal(
        "An error occurred while deleting availability. Please try again."
      );
    } finally {
      slotToDeleteId = null;
      hideAllModals();
    }
  });
