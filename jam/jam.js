if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js")
    .then(() => console.log("Service Worker aktif! 💪"))
    .catch(err => console.log("Service Worker gagal:", err));
  }
class ClockApp {
      constructor() {
        this.elements = {
          hourHand: document.getElementById('hourHand'),
          minuteHand: document.getElementById('minuteHand'),
          secondHand: document.getElementById('secondHand'),
          digitalTime: document.getElementById('digitalTime'),
          dateDisplay: document.getElementById('dateDisplay'),
          locationDisplay: document.getElementById('locationDisplay'),
          locationText: document.getElementById('locationText'),
          locationStatus: document.getElementById('locationStatus'),
          timezone: document.getElementById('timezone'),
          utcOffset: document.getElementById('utcOffset'),
          dayOfYear: document.getElementById('dayOfYear'),
          weekNumber: document.getElementById('weekNumber'),
          dayProgress: document.getElementById('dayProgress'),
          dayProgressBar: document.getElementById('dayProgressBar'),
          sunrise: document.getElementById('sunrise'),
          sunset: document.getElementById('sunset'),
          pomodoroTimer: document.getElementById('pomodoroTimer'),
          pomodoroStatus: document.getElementById('pomodoroStatus'),
          soundToggle: document.getElementById('soundToggle'),
          fullscreenBtn: document.getElementById('fullscreenBtn'),
          autoThemeToggle: document.getElementById('autoThemeToggle'),
          currentTimeForTheme: document.getElementById('currentTimeForTheme'),
          // Location elements
          latitude: document.getElementById('latitude'),
          longitude: document.getElementById('longitude'),
          country: document.getElementById('country'),
          region: document.getElementById('region'),
          // Day Counter elements
          dayCounterDisplay: document.getElementById('dayCounterDisplay'),
          dayCounterResult: document.getElementById('dayCounterResult'),
          counterStartDate: document.getElementById('counterStartDate'),
          counterEndDate: document.getElementById('counterEndDate'),
          // Stopwatch elements
          stopwatchDisplay: document.getElementById('stopwatchDisplay'),
          lapList: document.getElementById('lapList'),
          // Alarm elements
          alarmTime: document.getElementById('alarmTime'),
          alarmLabel: document.getElementById('alarmLabel'),
          alarmList: document.getElementById('alarmList'),
          // Countdown elements
          countdownDisplay: document.getElementById('countdownDisplay'),
          countdownHours: document.getElementById('countdownHours'),
          countdownMinutes: document.getElementById('countdownMinutes'),
          countdownSeconds: document.getElementById('countdownSeconds'),
          // Timezone converter elements
          fromTime: document.getElementById('fromTime'),
          fromTimezone: document.getElementById('fromTimezone'),
          toTimezone: document.getElementById('toTimezone'),
          timezoneResult: document.getElementById('timezoneResult'),
          timezoneResultTime: document.getElementById('timezoneResultTime'),
          timezoneResultInfo: document.getElementById('timezoneResultInfo'),
          // Event elements
          eventDisplay: document.getElementById('eventDisplay'),
          eventName: document.getElementById('eventName'),
          eventDate: document.getElementById('eventDate'),
          eventList: document.getElementById('eventList')
        };

        this.use24Hour = true;
        this.soundEnabled = true;
        this.clockStyle = 'classic';
        this.pomodoroTime = 25 * 60;
        this.pomodoroRunning = false;
        this.pomodoroInterval = null;
        this.audioContext = null;
        this.autoThemeEnabled = false;
        this.isFullscreen = false;
        
        // Location properties
        this.userLocation = {
          latitude: null,
          longitude: null,
          city: null,
          region: null,
          country: null,
          timezone: null,
          timezoneOffset: null
        };
        
        // Day Counter properties
        this.dayCounterStartDate = null;
        this.dayCounterEndDate = null;
        
        // Stopwatch properties
        this.stopwatchTime = 0;
        this.stopwatchRunning = false;
        this.stopwatchInterval = null;
        this.lapTimes = [];
        
        // Alarm properties
        this.alarms = [];
        this.alarmInterval = null;
        
        // Countdown properties
        this.countdownTime = 0;
        this.countdownRunning = false;
        this.countdownInterval = null;
        
        // Event properties
        this.events = [];
        this.eventInterval = null;

        this.init();
      }

      init() {
        this.setupEventListeners();
        this.updateClock();
        this.startClock();
        this.updateWorldClocks();
        setInterval(() => this.updateWorldClocks(), 1000);
        this.requestNotificationPermission();
        
        // Initialize day counter with today's date
        const today = new Date();
        this.elements.counterStartDate.value = today.toISOString().split('T')[0];
        
        // Start alarm checker
        this.startAlarmChecker();
        
        // Start event checker
        this.startEventChecker();
        
        // Get user location
        this.getUserLocation();
        
        // Setup auto theme switching
        this.setupAutoTheme();
      }

      setupEventListeners() {
        // Theme
        document.querySelectorAll('.theme-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            document.documentElement.setAttribute('data-theme', theme);
            document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            this.playSound('click');
          });
        });

        // Clock style
        document.querySelectorAll('.clock-style').forEach(btn => {
          btn.addEventListener('click', () => {
            const style = btn.dataset.style;
            this.setClockStyle(style);
            document.querySelectorAll('.clock-style').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
          });
        });

        // Format toggle
        document.getElementById('toggleFormat').addEventListener('click', () => {
          this.use24Hour = !this.use24Hour;
          this.updateClock();
        });

        // Sync
        document.getElementById('syncNow').addEventListener('click', () => {
          this.updateClock();
          this.playSound('sync');
        });
        
        // Update location
        document.getElementById('updateLocation').addEventListener('click', () => {
          this.getUserLocation();
        });

        // Sound toggle
        this.elements.soundToggle.addEventListener('click', () => {
          this.soundEnabled = !this.soundEnabled;
          const icon = this.elements.soundToggle.querySelector('i');
          if (this.soundEnabled) {
            icon.className = 'fa-solid fa-volume-high';
            this.elements.soundToggle.classList.add('active');
          } else {
            icon.className = 'fa-solid fa-volume-xmark';
            this.elements.soundToggle.classList.remove('active');
          }
        });
        
        // Fullscreen toggle
        this.elements.fullscreenBtn.addEventListener('click', () => {
          this.toggleFullscreen();
        });
        
        // Auto theme toggle
        this.elements.autoThemeToggle.addEventListener('click', () => {
          this.toggleAutoTheme();
        });

        // Tabs
        document.querySelectorAll('.tab').forEach(tab => {
          tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            document.querySelectorAll('.tab').forEach(t => {
              t.classList.toggle('active', t === tab);
              t.setAttribute('aria-selected', t === tab);
            });
            document.querySelectorAll('.tab-content').forEach(c => {
              c.classList.toggle('active', c.id === `${target}-tab`);
            });
          });
        });

        // Pomodoro
        document.getElementById('pomodoroStart').addEventListener('click', () => {
          this.pomodoroRunning ? this.pausePomodoro() : this.startPomodoro();
        });
        document.getElementById('pomodoroReset').addEventListener('click', () => {
          this.resetPomodoro();
        });
        
        // Countdown
        document.getElementById('countdownStart').addEventListener('click', () => {
          this.startCountdown();
        });
        document.getElementById('countdownPause').addEventListener('click', () => {
          this.pauseCountdown();
        });
        document.getElementById('countdownReset').addEventListener('click', () => {
          this.resetCountdown();
        });
        
        // Timezone converter
        document.getElementById('convertTimezone').addEventListener('click', () => {
          this.convertTimezone();
        });
        
        // Event countdown
        document.getElementById('addEvent').addEventListener('click', () => {
          this.addEvent();
        });
        
        // Day Counter
        document.getElementById('updateDayCounter').addEventListener('click', () => {
          this.updateDayCounter();
        });
        
        // Stopwatch
        document.getElementById('stopwatchStart').addEventListener('click', () => {
          this.startStopwatch();
        });
        document.getElementById('stopwatchPause').addEventListener('click', () => {
          this.pauseStopwatch();
        });
        document.getElementById('stopwatchReset').addEventListener('click', () => {
          this.resetStopwatch();
        });
        document.getElementById('stopwatchLap').addEventListener('click', () => {
          this.recordLap();
        });
        
        // Alarm
        document.getElementById('addAlarm').addEventListener('click', () => {
          this.addAlarm();
        });

        // Init audio on first interaction
        document.body.addEventListener('click', () => {
          if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
          }
        }, { once: true });
        
        // Handle fullscreen change
        document.addEventListener('fullscreenchange', () => {
          this.isFullscreen = !!document.fullscreenElement;
          const icon = this.elements.fullscreenBtn.querySelector('i');
          if (this.isFullscreen) {
            icon.className = 'fa-solid fa-compress';
          } else {
            icon.className = 'fa-solid fa-expand';
          }
        });
      }

      setClockStyle(style) {
        this.clockStyle = style;
        const clock = document.getElementById('analogClock');
        clock.className = `clock ${style}`;

        const numbers = document.querySelectorAll('.clock-number');
        const roman = ['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];

        numbers.forEach((el, i) => {
          if (style === 'minimal') {
            el.style.display = 'none';
          } else {
            el.style.display = 'block';
            el.textContent = style === 'roman' ? roman[i] : [12,1,2,3,4,5,6,7,8,9,10,11][i];
          }
        });

        this.playSound('click');
      }

      updateClock() {
        // Get current time based on user's location timezone
        let now;
        if (this.userLocation.timezone) {
          // Create date string in the user's timezone
          const nowUTC = new Date();
          const localTime = new Date(nowUTC.toLocaleString("en-US", {timeZone: this.userLocation.timezone}));
          now = localTime;
        } else {
          // Fallback to local time
          now = new Date();
        }

        // Hands
        const sec = now.getSeconds() + now.getMilliseconds() / 1000;
        const min = now.getMinutes() + sec / 60;
        const hr = (now.getHours() % 12) + min / 60;

        this.elements.secondHand.style.transform = `rotate(${sec * 6}deg)`;
        this.elements.minuteHand.style.transform = `rotate(${min * 6}deg)`;
        this.elements.hourHand.style.transform = `rotate(${hr * 30}deg)`;

        // Digital time
        let h = now.getHours();
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');
        let period = '';
        if (!this.use24Hour) {
          period = h >= 12 ? ' PM' : ' AM';
          h = h % 12 || 12;
        }
        this.elements.digitalTime.textContent = `${String(h).padStart(2, '0')}:${m}:${s}${period}`;

        // Date
        this.elements.dateDisplay.textContent = now.toLocaleDateString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: this.userLocation.timezone || undefined
        });

        // Timezone
        if (this.userLocation.timezone) {
          this.elements.timezone.textContent = this.userLocation.timezone;
        } else {
          this.elements.timezone.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone;
        }

        // UTC offset
        let offset;
        if (this.userLocation.timezoneOffset !== null) {
          offset = this.userLocation.timezoneOffset;
        } else {
          offset = -now.getTimezoneOffset();
        }
        
        const sign = offset >= 0 ? '+' : '-';
        const abs = Math.abs(offset);
        const utcH = String(Math.floor(abs / 60)).padStart(2, '0');
        const utcM = String(abs % 60).padStart(2, '0');
        this.elements.utcOffset.textContent = `UTC${sign}${utcH}:${utcM}`;

        // Day of year
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = (now - start) / 86400000;
        this.elements.dayOfYear.textContent = Math.floor(diff);

        // Week number
        const jan1 = new Date(now.getFullYear(), 0, 1);
        const days = Math.floor((now - jan1) / 86400000);
        const week = Math.ceil((days + jan1.getDay() + 1) / 7);
        this.elements.weekNumber.textContent = week;

        // Day progress
        const totalSec = 86400;
        const passed = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        const percent = (passed / totalSec) * 100;
        this.elements.dayProgress.textContent = `${percent.toFixed(2)}%`;
        this.elements.dayProgressBar.style.width = `${percent}%`;

        // Sun info (more accurate based on location)
        this.calculateSunTimes(now);
        
        // Update current time for auto theme
        this.elements.currentTimeForTheme.textContent = now.toLocaleTimeString();
      }

      calculateSunTimes(date) {
        if (!this.userLocation.latitude || !this.userLocation.longitude) {
          // Fallback to approximate calculation
          const doy = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
          const sunriseH = 6 + Math.sin((doy - 80) * Math.PI / 182) * 1.5;
          const sunsetH = 18 + Math.sin((doy - 80) * Math.PI / 182) * 1.5;
          this.elements.sunrise.textContent = `${Math.floor(sunriseH)}:${String(Math.round((sunriseH % 1) * 60)).padStart(2, '0')}`;
          this.elements.sunset.textContent = `${Math.floor(sunsetH)}:${String(Math.round((sunsetH % 1) * 60)).padStart(2, '0')}`;
          return;
        }

        // More accurate sun calculation based on latitude
        const lat = this.userLocation.latitude * Math.PI / 180;
        const doy = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
        
        // Solar declination
        const declination = -23.45 * Math.cos((360 * (284 + doy) / 365) * Math.PI / 180) * Math.PI / 180;
        
        // Hour angle
        const hourAngle = Math.acos(-Math.tan(lat) * Math.tan(declination));
        
        // Sunrise and sunset in hours from midnight
        const sunrise = 12 - hourAngle * 12 / Math.PI;
        const sunset = 12 + hourAngle * 12 / Math.PI;
        
        // Format times
        this.elements.sunrise.textContent = `${Math.floor(sunrise)}:${String(Math.round((sunriseH % 1) * 60)).padStart(2, '0')}`;
        this.elements.sunset.textContent = `${Math.floor(sunset)}:${String(Math.round((sunsetH % 1) * 60)).padStart(2, '0')}`;
      }

      startClock() {
        setInterval(() => {
          this.updateClock();
          if (this.soundEnabled) this.playSound('tick');
        }, 1000);
      }

      updateWorldClocks() {
        const now = new Date();
        const cities = {
          'ny-time': { timezone: 'America/New_York', name: 'New York' },
          'london-time': { timezone: 'Europe/London', name: 'London' },
          'tokyo-time': { timezone: 'Asia/Tokyo', name: 'Tokyo' },
          'sydney-time': { timezone: 'Australia/Sydney', name: 'Sydney' }
        };
        
        Object.entries(cities).forEach(([id, city]) => {
          const time = new Date(now.toLocaleString("en-US", {timeZone: city.timezone}));
          const hours = String(time.getHours()).padStart(2, '0');
          const minutes = String(time.getMinutes()).padStart(2, '0');
          document.getElementById(id).textContent = `${hours}:${minutes}`;
        });
      }

      // Location methods
      getUserLocation() {
        // Update status to loading
        this.updateLocationStatus('loading', '<i class="fa-solid fa-spinner fa-spin"></i>');
        
        if (!navigator.geolocation) {
          this.updateLocationStatus('error', '<i class="fa-solid fa-exclamation-circle"></i>');
          this.elements.locationText.textContent = 'Geolocation not supported';
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.userLocation.latitude = position.coords.latitude;
            this.userLocation.longitude = position.coords.longitude;
            
            // Update UI with coordinates
            this.elements.latitude.textContent = this.userLocation.latitude.toFixed(6);
            this.elements.longitude.textContent = this.userLocation.longitude.toFixed(6);
            
            // Get timezone and location name
            this.getTimezoneFromCoordinates(this.userLocation.latitude, this.userLocation.longitude);
          },
          (error) => {
            this.updateLocationStatus('error', '<i class="fa-solid fa-exclamation-circle"></i>');
            this.elements.locationText.textContent = 'Location access denied';
            console.error('Error getting location:', error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      }

      getTimezoneFromCoordinates(lat, lon) {
        // Using timezone API based on coordinates
        // Using a free timezone API (you might want to replace with your preferred service)
        fetch(`https://api.timezonedb.com/v2.1/get-time-zone?key=YOUR_API_KEY&format=json&by=position&lat=${lat}&lng=${lon}`)
          .then(response => response.json())
          .then(data => {
            if (data.status === 'OK') {
              this.userLocation.timezone = data.zoneName;
              this.userLocation.timezoneOffset = parseInt(data.gmtOffset) / 60;
              
              // Update timezone display
              this.elements.timezone.textContent = this.userLocation.timezone;
              
              // Get location name
              this.getLocationName(lat, lon);
            } else {
              throw new Error('Failed to get timezone');
            }
          })
          .catch(error => {
            console.error('Error getting timezone:', error);
            // Fallback to browser timezone
            this.userLocation.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            this.getLocationName(lat, lon);
          });
      }

      getLocationName(lat, lon) {
        // Using Nominatim OpenStreetMap API for reverse geocoding
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`)
          .then(response => response.json())
          .then(data => {
            if (data && data.address) {
              const address = data.address;
              this.userLocation.city = address.city || address.town || address.village || 'Not Mentioned';
              this.userLocation.region = address.state || address.region || 'Unknown';
              this.userLocation.country = address.country || 'Unknown';
              
              // Update UI with location name
              this.elements.locationText.textContent = 
                `${this.userLocation.city}, ${this.userLocation.region}, ${this.userLocation.country}`;
              
              this.elements.country.textContent = this.userLocation.country;
              this.elements.region.textContent = this.userLocation.region;
              
              // Update status to success
              this.updateLocationStatus('success', '<i class="fa-solid fa-check-circle"></i>');
              
              // Update clock with new timezone
              this.updateClock();
            } else {
              throw new Error('No address data found');
            }
          })
          .catch(error => {
            console.error('Error getting location name:', error);
            // Fallback to coordinates only
            this.elements.locationText.textContent = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
            this.updateLocationStatus('success', '<i class="fa-solid fa-check-circle"></i>');
          });
      }

      updateLocationStatus(status, icon) {
        this.elements.locationStatus.className = `location-status ${status}`;
        this.elements.locationStatus.innerHTML = icon;
      }

      // Pomodoro methods
      startPomodoro() {
        this.pomodoroRunning = true;
        document.getElementById('pomodoroStart').innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
        this.elements.pomodoroStatus.textContent = 'Focus time!';
        this.pomodoroInterval = setInterval(() => {
          if (this.pomodoroTime > 0) {
            this.pomodoroTime--;
            this.updatePomodoroDisplay();
          } else {
            this.completePomodoro();
          }
        }, 1000);
        this.playSound('start');
      }

      pausePomodoro() {
        this.pomodoroRunning = false;
        clearInterval(this.pomodoroInterval);
        document.getElementById('pomodoroStart').innerHTML = '<i class="fa-solid fa-play"></i> Start';
        this.elements.pomodoroStatus.textContent = 'Paused';
        this.playSound('pause');
      }

      resetPomodoro() {
        this.pausePomodoro();
        this.pomodoroTime = 25 * 60;
        this.updatePomodoroDisplay();
        this.elements.pomodoroStatus.textContent = 'Ready to focus';
        this.playSound('reset');
      }

      completePomodoro() {
        this.pausePomodoro();
        this.elements.pomodoroStatus.textContent = 'Time for a break!';
        this.playSound('alarm');
        if (Notification.permission === 'granted') {
          new Notification('Pomodoro Complete!', { body: 'Great job! Take a short break.' });
        }
      }

      updatePomodoroDisplay() {
        const m = Math.floor(this.pomodoroTime / 60);
        const s = this.pomodoroTime % 60;
        this.elements.pomodoroTimer.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      }

      // Countdown Timer methods
      startCountdown() {
        if (!this.countdownRunning) {
          // Get time from inputs
          const hours = parseInt(this.elements.countdownHours.value) || 0;
          const minutes = parseInt(this.elements.countdownMinutes.value) || 0;
          const seconds = parseInt(this.elements.countdownSeconds.value) || 0;
          
          // If countdown is at 0, set it to the input values
          if (this.countdownTime === 0) {
            this.countdownTime = hours * 3600 + minutes * 60 + seconds;
          }
          
          if (this.countdownTime > 0) {
            this.countdownRunning = true;
            this.countdownInterval = setInterval(() => {
              if (this.countdownTime > 0) {
                this.countdownTime--;
                this.updateCountdownDisplay();
              } else {
                this.completeCountdown();
              }
            }, 1000);
            this.playSound('start');
          }
        }
      }

      pauseCountdown() {
        if (this.countdownRunning) {
          this.countdownRunning = false;
          clearInterval(this.countdownInterval);
          this.playSound('pause');
        }
      }

      resetCountdown() {
        this.pauseCountdown();
        this.countdownTime = 0;
        this.updateCountdownDisplay();
        this.playSound('reset');
      }

      completeCountdown() {
        this.pauseCountdown();
        this.playSound('alarm');
        if (Notification.permission === 'granted') {
          new Notification('Countdown Complete!', { body: 'Your countdown timer has finished.' });
        }
      }

      updateCountdownDisplay() {
        const hours = Math.floor(this.countdownTime / 3600);
        const minutes = Math.floor((this.countdownTime % 3600) / 60);
        const seconds = this.countdownTime % 60;
        
        this.elements.countdownDisplay.textContent = 
          `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      }

      // Timezone Converter methods
      convertTimezone() {
        const fromTime = this.elements.fromTime.value;
        const fromTimezone = this.elements.fromTimezone.value;
        const toTimezone = this.elements.toTimezone.value;
        
        if (!fromTime) {
          return;
        }
        
        // Create a date object with today's date and the selected time
        const today = new Date();
        const [hours, minutes] = fromTime.split(':').map(Number);
        
        // Create date in the source timezone
        const sourceDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
        
        // Format the date in the source timezone to get the correct UTC time
        const sourceTimeUTC = new Date(sourceDate.toLocaleString("en-US", {timeZone: fromTimezone}));
        
        // Convert UTC time to the target timezone
        const targetTime = new Date(sourceTimeUTC.toLocaleString("en-US", {timeZone: toTimezone}));
        
        // Format the result
        const targetHours = String(targetTime.getHours()).padStart(2, '0');
        const targetMinutes = String(targetTime.getMinutes()).padStart(2, '0');
        
        // Display the result
        this.elements.timezoneResultTime.textContent = `${targetHours}:${targetMinutes}`;
        this.elements.timezoneResultInfo.textContent = `${fromTime} in ${fromTimezone} is ${targetHours}:${targetMinutes} in ${toTimezone}`;
        this.elements.timezoneResult.style.display = 'block';
        
        this.playSound('click');
      }

      // Event Countdown methods
      addEvent() {
        const name = this.elements.eventName.value;
        const date = this.elements.eventDate.value;
        
        if (!name || !date) {
          return;
        }
        
        const event = {
          id: Date.now(),
          name: name,
          date: new Date(date)
        };
        
        this.events.push(event);
        this.renderEvents();
        
        // Clear inputs
        this.elements.eventName.value = '';
        this.elements.eventDate.value = '';
        
        // Update display to show the next event
        this.updateEventDisplay();
        
        this.playSound('click');
      }

      deleteEvent(id) {
        this.events = this.events.filter(event => event.id !== id);
        this.renderEvents();
        this.updateEventDisplay();
        this.playSound('click');
      }

      renderEvents() {
        this.elements.eventList.innerHTML = '';
        
        if (this.events.length === 0) {
          const emptyMessage = document.createElement('div');
          emptyMessage.className = 'info-item';
          emptyMessage.textContent = 'No events added';
          this.elements.eventList.appendChild(emptyMessage);
          return;
        }
        
        // Sort events by date (closest first)
        const sortedEvents = [...this.events].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        sortedEvents.forEach(event => {
          const eventItem = document.createElement('div');
          eventItem.className = 'event-item';
          
          // Calculate time remaining
          const now = new Date();
          const eventDate = new Date(event.date);
          const diff = eventDate - now;
          
          let timeRemaining = '';
          if (diff > 0) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            
            if (days > 0) {
              timeRemaining = `${days}d ${hours}h ${minutes}m`;
            } else if (hours > 0) {
              timeRemaining = `${hours}h ${minutes}m`;
            } else {
              timeRemaining = `${minutes}m ${Math.floor((diff % (1000 * 60)) / 1000)}s`;
            }
          } else {
            timeRemaining = 'Event passed';
          }
          
          eventItem.innerHTML = `
            <div>
              <div class="event-name">${event.name}</div>
              <div class="event-date">${eventDate.toLocaleDateString()} ${eventDate.toLocaleTimeString()}</div>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 5px;">
              <div style="font-weight: 600;">${timeRemaining}</div>
              <button class="btn btn-secondary" style="padding: 6px 10px; font-size: 12px;" data-id="${event.id}" data-action="delete">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          `;
          
          // Add event listener
          eventItem.querySelector('[data-action="delete"]').addEventListener('click', () => {
            this.deleteEvent(event.id);
          });
          
          this.elements.eventList.appendChild(eventItem);
        });
      }

      updateEventDisplay() {
        if (this.events.length === 0) {
          this.elements.eventDisplay.textContent = 'No events';
          return;
        }
        
        // Find the next upcoming event
        const now = new Date();
        const upcomingEvents = this.events.filter(event => new Date(event.date) > now);
        
        if (upcomingEvents.length === 0) {
          this.elements.eventDisplay.textContent = 'No upcoming events';
          return;
        }
        
        // Sort by date and get the closest one
        upcomingEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
        const nextEvent = upcomingEvents[0];
        
        // Calculate time remaining
        const eventDate = new Date(nextEvent.date);
        const diff = eventDate - now;
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        let displayText = '';
        if (days > 0) {
          displayText = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        } else if (hours > 0) {
          displayText = `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
          displayText = `${minutes}m ${seconds}s`;
        } else {
          displayText = `${seconds}s`;
        }
        
        this.elements.eventDisplay.textContent = `${nextEvent.name}: ${displayText}`;
      }

      startEventChecker() {
        this.eventInterval = setInterval(() => {
          this.updateEventDisplay();
        }, 1000);
      }

      // Day Counter methods
      updateDayCounter() {
        const startDate = new Date(this.elements.counterStartDate.value);
        const endDate = this.elements.counterEndDate.value ? new Date(this.elements.counterEndDate.value) : new Date();
        
        if (isNaN(startDate.getTime())) {
          this.elements.dayCounterResult.textContent = 'Please select a valid start date';
          return;
        }
        
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        this.elements.dayCounterDisplay.textContent = `${diffDays} days`;
        this.elements.dayCounterResult.textContent = 
          `${diffDays} days between ${startDate.toLocaleDateString()} and ${endDate.toLocaleDateString()}`;
        
        this.playSound('click');
      }

      // Stopwatch methods
      startStopwatch() {
        if (!this.stopwatchRunning) {
          this.stopwatchRunning = true;
          this.stopwatchInterval = setInterval(() => {
            this.stopwatchTime += 10; // increment by 10ms
            this.updateStopwatchDisplay();
          }, 10);
          this.playSound('start');
        }
      }

      pauseStopwatch() {
        if (this.stopwatchRunning) {
          this.stopwatchRunning = false;
          clearInterval(this.stopwatchInterval);
          this.playSound('pause');
        }
      }

      resetStopwatch() {
        this.stopwatchRunning = false;
        clearInterval(this.stopwatchInterval);
        this.stopwatchTime = 0;
        this.lapTimes = [];
        this.updateStopwatchDisplay();
        this.elements.lapList.innerHTML = '';
        this.playSound('reset');
      }

      recordLap() {
        if (this.stopwatchRunning) {
          const lapTime = this.stopwatchTime;
          this.lapTimes.push(lapTime);
          
          const lapItem = document.createElement('div');
          lapItem.className = 'lap-item';
          lapItem.innerHTML = `
            <span>Lap ${this.lapTimes.length}</span>
            <span>${this.formatStopwatchTime(lapTime)}</span>
          `;
          
          this.elements.lapList.prepend(lapItem);
          this.playSound('click');
        }
      }

      updateStopwatchDisplay() {
        this.elements.stopwatchDisplay.textContent = this.formatStopwatchTime(this.stopwatchTime);
      }

      formatStopwatchTime(time) {
        const minutes = Math.floor(time / 60000);
        const seconds = Math.floor((time % 60000) / 1000);
        const milliseconds = Math.floor((time % 1000) / 10);
        
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
      }

      // Alarm methods
      addAlarm() {
        const time = this.elements.alarmTime.value;
        const label = this.elements.alarmLabel.value || 'Alarm';
        
        if (!time) {
          return;
        }
        
        const alarm = {
          id: Date.now(),
          time: time,
          label: label,
          active: true
        };
        
        this.alarms.push(alarm);
        this.renderAlarms();
        
        // Clear inputs
        this.elements.alarmTime.value = '';
        this.elements.alarmLabel.value = '';
        
        this.playSound('click');
      }

      deleteAlarm(id) {
        this.alarms = this.alarms.filter(alarm => alarm.id !== id);
        this.renderAlarms();
        this.playSound('click');
      }

      toggleAlarm(id) {
        const alarm = this.alarms.find(a => a.id === id);
        if (alarm) {
          alarm.active = !alarm.active;
          this.renderAlarms();
          this.playSound('click');
        }
      }

      renderAlarms() {
        this.elements.alarmList.innerHTML = '';
        
        if (this.alarms.length === 0) {
          const emptyMessage = document.createElement('div');
          emptyMessage.className = 'info-item';
          emptyMessage.textContent = 'No alarms set';
          this.elements.alarmList.appendChild(emptyMessage);
          return;
        }
        
        this.alarms.forEach(alarm => {
          const alarmItem = document.createElement('div');
          alarmItem.className = 'alarm-item';
          
          alarmItem.innerHTML = `
            <div>
              <div class="alarm-time">${alarm.time}</div>
              <div class="alarm-label">${alarm.label}</div>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn" style="padding: 6px 10px; font-size: 12px;" data-id="${alarm.id}" data-action="toggle">
                <i class="fa-solid ${alarm.active ? 'fa-toggle-on' : 'fa-toggle-off'}"></i>
              </button>
              <button class="btn btn-secondary" style="padding: 6px 10px; font-size: 12px;" data-id="${alarm.id}" data-action="delete">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          `;
          
          // Add event listeners
          alarmItem.querySelector('[data-action="toggle"]').addEventListener('click', () => {
            this.toggleAlarm(alarm.id);
          });
          
          alarmItem.querySelector('[data-action="delete"]').addEventListener('click', () => {
            this.deleteAlarm(alarm.id);
          });
          
          this.elements.alarmList.appendChild(alarmItem);
        });
      }

      startAlarmChecker() {
        this.alarmInterval = setInterval(() => {
          // Get current time in user's timezone
          let now;
          if (this.userLocation.timezone) {
            const nowUTC = new Date();
            now = new Date(nowUTC.toLocaleString("en-US", {timeZone: this.userLocation.timezone}));
          } else {
            now = new Date();
          }
          
          const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          
          this.alarms.forEach(alarm => {
            if (alarm.active && alarm.time === currentTime) {
              this.triggerAlarm(alarm);
              // Deactivate alarm after triggering
              alarm.active = false;
              this.renderAlarms();
            }
          });
        }, 1000);
      }

      triggerAlarm(alarm) {
        this.playSound('alarm');
        
        if (Notification.permission === 'granted') {
          new Notification('Alarm!', { 
            body: `${alarm.label} - ${alarm.time}`,
            icon: 'https://cdn-icons-png.flaticon.com/512/3471/3471705.png'
          });
        }
      }

      // Fullscreen methods
      toggleFullscreen() {
        if (!this.isFullscreen) {
          // Enter fullscreen
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
          } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen();
          } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
          }
        } else {
          // Exit fullscreen
          if (document.exitFullscreen) {
            document.exitFullscreen();
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
          } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
          }
        }
        this.playSound('click');
      }

      // Auto theme methods
      toggleAutoTheme() {
        this.autoThemeEnabled = !this.autoThemeEnabled;
        this.elements.autoThemeToggle.classList.toggle('active', this.autoThemeEnabled);
        
        if (this.autoThemeEnabled) {
          this.setupAutoTheme();
        }
        
        this.playSound('click');
      }

      setupAutoTheme() {
        if (!this.autoThemeEnabled) return;
        
        const now = new Date();
        const hour = now.getHours();
        
        // Set theme based on time of day
        let theme;
        if (hour >= 6 && hour < 12) {
          // Morning - Ocean theme
          theme = 'ocean';
        } else if (hour >= 12 && hour < 18) {
          // Afternoon - Forest theme
          theme = 'forest';
        } else if (hour >= 18 && hour < 21) {
          // Evening - Sunset theme
          theme = 'sunset';
        } else {
          // Night - Dark theme
          theme = 'dark';
        }
        
        document.documentElement.setAttribute('data-theme', theme);
        document.querySelectorAll('.theme-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.theme === theme);
        });
        
        // Check again in 10 minutes
        if (this.autoThemeEnabled) {
          setTimeout(() => this.setupAutoTheme(), 600000);
        }
      }

      // Sound
      playSound(type) {
        if (!this.soundEnabled || !this.audioContext) return;
        const ctx = this.audioContext;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        let freq = 1000, dur = 0.1, typeMap = {
          tick: { f: 1000, t: 'sine', v: 0.1 },
          click: { f: 1500, t: 'sine', v: 0.2 },
          start: { f: 800, t: 'triangle', v: 0.3 },
          pause: { f: 600, t: 'triangle', v: 0.3 },
          reset: { f: 400, t: 'sawtooth', v: 0.3 },
          alarm: { f: 880, t: 'square', v: 0.4 },
          sync: { f: 1200, t: 'sine', v: 0.3 }
        }[type] || { f: 1000, t: 'sine', v: 0.1 };

        osc.type = typeMap.t;
        osc.frequency.value = typeMap.f;
        gain.gain.value = typeMap.v;
        osc.start();
        setTimeout(() => osc.stop(), dur * 1000);
      }

      requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }
      }
    }

    document.addEventListener('DOMContentLoaded', () => new ClockApp());
