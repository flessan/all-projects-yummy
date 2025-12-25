document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();

    // Set default date to today
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    document.getElementById('date-input').value = formattedDate;

    // Elements
    const dateInput = document.getElementById('date-input');
    const timeInput = document.getElementById('time-input');
    const timezoneSelect = document.getElementById('timezone-select');
    const timestampPreview = document.getElementById('timestamp-preview');
    const previewTimestamp = document.getElementById('preview-timestamp');
    const copyButton = document.getElementById('copy-btn');
    const formatButtons = document.querySelectorAll('.format-btn');

    let currentFormat = 'f';

    // Helper: get timezone offset in minutes for named zones (basic support)
    function getTZOffset(tz) {
        // Only basic support, for demonstration purposes
        const now = new Date();
        switch (tz) {
            case 'UTC':
            case 'GMT':
                return 0;
            case 'EST':
                return -5 * 60;
            case 'PST':
                return -8 * 60;
            case 'CET':
                return 1 * 60;
            case 'AEST':
                return 10 * 60;
            case 'auto':
            default:
                return -now.getTimezoneOffset();
        }
    }

    // Format date for preview
    function formatDate(date, format) {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };

        switch(format) {
            case 't': // Short time
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            case 'T': // Long time
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            case 'd': // Short date
                return date.toLocaleDateString();
            case 'D': // Long date
                return date.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
            case 'f': // Default
                return date.toLocaleDateString([], { ...options });
            case 'F': // Long
                return date.toLocaleDateString([], { ...options, weekday: 'long' });
            case 'R': // Relative
                const now = new Date();
                const diff = date - now;
                const absDiff = Math.abs(diff);

                if (absDiff < 60000) return 'just now';
                if (absDiff < 3600000) {
                    const mins = Math.floor(absDiff / 60000);
                    return `${diff < 0 ? mins + ' minutes ago' : 'in ' + mins + ' minutes'}`;
                }
                if (absDiff < 86400000) {
                    const hours = Math.floor(absDiff / 3600000);
                    return `${diff < 0 ? hours + ' hours ago' : 'in ' + hours + ' hours'}`;
                }
                const days = Math.floor(absDiff / 86400000);
                return `${diff < 0 ? days + ' days ago' : 'in ' + days + ' days'}`;
            default:
                return date.toLocaleString();
        }
    }

    // Update timestamp when inputs change
    function updateTimestamp() {
        const dateValue = dateInput.value;
        const timeValue = timeInput.value;
        const tzValue = timezoneSelect.value;

        if (!dateValue || !timeValue) {
            timestampPreview.textContent = 'Please select a valid date and time';
            previewTimestamp.textContent = '[timestamp]';
            return;
        }

        // Combine date and time, always at 00 seconds
        let dateTimeString = `${dateValue}T${timeValue}:00`;

        // Parse in UTC, then apply timezone offset
        let dateObj = new Date(dateTimeString);

        // Adjust for timezone
        let offsetMinutes = getTZOffset(tzValue);
        // JS Date is always local on construction, so adjust by difference
        let userOffset = -dateObj.getTimezoneOffset();
        let diff = offsetMinutes - userOffset;
        dateObj = new Date(dateObj.getTime() + diff * 60000);

        if (isNaN(dateObj.getTime())) {
            timestampPreview.textContent = 'Invalid date/time selected';
            previewTimestamp.textContent = '[timestamp]';
            return;
        }

        // Convert to Unix timestamp (seconds)
        const unixTimestamp = Math.floor(dateObj.getTime() / 1000);

        // Generate Discord timestamp
        const timestamp = `<t:${unixTimestamp}:${currentFormat}>`;
        timestampPreview.textContent = timestamp;

        // Update preview in message
        previewTimestamp.textContent = formatDate(dateObj, currentFormat);
    }

    // Copy to clipboard
    copyButton.addEventListener('click', function() {
        const textToCopy = timestampPreview.textContent;
        if (!textToCopy.startsWith('<t:')) {
            alert('Please generate a valid timestamp first');
            return;
        }

        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                copyButton.innerHTML = '<i class="fas fa-check"></i> Copied!';
                copyButton.classList.add('copied');
                setTimeout(() => {
                    copyButton.innerHTML = '<i class="fas fa-copy"></i> Copy to Clipboard';
                    copyButton.classList.remove('copied');
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                alert('Failed to copy to clipboard. Please copy manually.');
            });
    });

    // Format selection
    formatButtons.forEach(button => {
        button.addEventListener('click', function() {
            formatButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            currentFormat = this.getAttribute('data-format');
            updateTimestamp();
        });
    });

    // Initialize with current time
    updateTimestamp();

    // Set up event listeners
    dateInput.addEventListener('change', updateTimestamp);
    timeInput.addEventListener('change', updateTimestamp);
    timezoneSelect.addEventListener('change', updateTimestamp);
});
