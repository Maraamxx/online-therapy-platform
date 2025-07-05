document.addEventListener('DOMContentLoaded', function () {
    // Form submission handler
    document.getElementById('assessmentForm').addEventListener('submit', async function (event) {
        event.preventDefault();

        // Show searching overlay
        document.getElementById('searchingOverlay').style.display = 'flex';

        const form = event.target;
        const formData = new FormData(form);
        const data = {};

        // Handle mental_health_concerns (checkboxes)
        data.mental_health_concerns = [];
        form.querySelectorAll('input[name="mental_health_concerns"]:checked').forEach(checkbox => {
            data.mental_health_concerns.push(checkbox.value);
        });

        // Handle preferred_therapist_gender (radio)
        const preferredGenderRadio = form.querySelector('input[name="preferred_therapist_gender"]:checked');
        data.preferred_therapist_gender = preferredGenderRadio ? (preferredGenderRadio.value === 'No Preference' ? null : preferredGenderRadio.value) : null;

        // Handle preferred_religion (select)
        const preferredReligionSelect = form.querySelector('select[name="preferred_religion"]');
        data.preferred_religion = preferredReligionSelect.value === '' ? null : preferredReligionSelect.value;

        // Handle preferred_language (select)
        const preferredLanguageSelect = form.querySelector('select[name="preferred_language"]');
        data.preferred_language = preferredLanguageSelect.value === '' ? null : preferredLanguageSelect.value;

        // Handle age_group_preference (select)
        const ageGroupPreferenceSelect = form.querySelector('select[name="age_group_preference"]');
        data.age_group_preference = ageGroupPreferenceSelect.value === '' ? null : ageGroupPreferenceSelect.value;

        // Handle time_availability (checkboxes for nested object)
        data.time_availability = {};
        const timeAvailabilityCheckboxes = form.querySelectorAll('input[name^="time_availability["]:checked');
        timeAvailabilityCheckboxes.forEach(checkbox => {
            const nameParts = checkbox.name.match(/time_availability\[(.*?)\]\[\]/);
            if (nameParts && nameParts[1]) {
                const day = nameParts[1];
                if (!data.time_availability[day]) {
                    data.time_availability[day] = [];
                }
                data.time_availability[day].push(checkbox.value);
            }
        });
        if (Object.keys(data.time_availability).length === 0) {
            data.time_availability = null;
        }

        try {
            // Clear previous results
            document.getElementById('results').innerHTML = '';
            document.getElementById('results').classList.remove('active');

            const response = await fetch('/api/assessment/match-therapist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + document.querySelector('meta[name="access-token"]').content
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            const resultsDiv = document.getElementById('results');
            resultsDiv.classList.add('active');

            // Hide searching overlay
            document.getElementById('searchingOverlay').style.display = 'none';

            // Scroll smoothly to results
            resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });

            if (result.success) {
                let html = `
                    <div class="result-card matched-therapist">
                        <h3><i class="fas fa-star"></i> Your Best Match:</h3>
                        <p><strong>Name:</strong> ${result.matchedTherapist.name}</p>
                        <p><strong>Specialization:</strong> ${result.matchedTherapist.specialization}</p>
                        <p><strong>Experience:</strong> ${result.matchedTherapist.experience_years} years</p>
                        <p><strong>Languages:</strong> ${result.matchedTherapist.languages.join(', ')}</p>
                        <p><strong>Religion:</strong> ${result.matchedTherapist.religion || 'Not specified'}</p>
                        <p><strong>Gender:</strong> ${result.matchedTherapist.gender}</p>
                        <button class="btn btn-secondary view-profile-btn" data-therapist-id="${result.matchedTherapist.therapist_id}">View Profile</button>
                    </div>
                `;
                if (result.topOtherOptions && result.topOtherOptions.length > 0) {
                    html += `
                        <h4>Other Highly Recommended Therapists:</h4>
                        <div class="other-options-grid">
                    `;
                    result.topOtherOptions.forEach(therapist => {
                        html += `
                            <div class="result-card other-option">
                                <p><strong>Name:</strong> ${therapist.name}</p>
                                <p><strong>Specialization:</strong> ${therapist.specialization}</p>
                                <p><strong>Languages:</strong> ${therapist.languages.join(', ')}</p>
                                <button class="btn btn-tertiary view-profile-btn" data-therapist-id="${therapist.therapist_id}">View Profile</button>
                            </div>
                        `;
                    });
                    html += `</div>`;
                }
                resultsDiv.innerHTML = html;

                // Add event listeners for "View Profile" buttons
                document.querySelectorAll('.view-profile-btn').forEach(button => {
                    button.addEventListener('click', function () {
                        const therapistId = this.dataset.therapistId;
                        window.location.href = `/api/therapists/${therapistId}`;
                    });
                });

            } else {
                resultsDiv.innerHTML = `
                    <div class="result-message no-match">
                        <h3><i class="fas fa-info-circle"></i> ${result.message}</h3>
                        <p>Consider adjusting your preferences or exploring our full directory of therapists.</p>
                        <button class="btn btn-primary browse-all-btn">Browse All Therapists</button>
                    </div>
                `;
                document.querySelector('.browse-all-btn').addEventListener('click', function () {
                    window.location.href = '/api/therapists';
                });
            }
        } catch (error) {
            console.error('Error submitting assessment:', error);
            document.getElementById('searchingOverlay').style.display = 'none';
            document.getElementById('results').innerHTML = `
                <div class="result-message error-message">
                    <h3><i class="fas fa-exclamation-triangle"></i> An error occurred.</h3>
                    <p>Please try again later. If the issue persists, contact support.</p>
                </div>
            `;
            document.getElementById('results').classList.add('active');
        }
    });

    // Form navigation
    const sections = Array.from(document.querySelectorAll('.form-section'));
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const submitBtn = document.getElementById('submitBtn');
    const progress = document.querySelector('.progress');
    let currentStep = 0;

    function showStep(step) {
        sections.forEach((sec, idx) => {
            sec.classList.toggle('active', idx === step);
        });
        prevBtn.style.display = step === 0 ? 'none' : '';
        nextBtn.style.display = step === sections.length - 1 ? 'none' : '';
        submitBtn.style.display = step === sections.length - 1 ? '' : 'none';
        progress.style.width = ((step + 1) / sections.length * 100) + '%';
    }

    nextBtn.addEventListener('click', function () {
        showStep(++currentStep);
    });
    prevBtn.addEventListener('click', function () {
        showStep(--currentStep);
    });

    // Initialize
    showStep(currentStep);
});
