document.addEventListener('DOMContentLoaded', function () {
    if (window.feather) {
        // Initialize all Feather icons
        feather.replace();

        // Add a small delay to ensure all icons are properly initialized
        setTimeout(() => {
            feather.replace();
        }, 100);
    }
});
