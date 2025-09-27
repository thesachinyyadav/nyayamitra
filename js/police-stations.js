// Police Stations functionality for SOS Alerts page

// Mock data for police stations
const mockPoliceStations = [
    {
        id: 1,
        name: "Central Police Station",
        type: "police",
        address: "123 Main St, City Center",
        phone: "+91 9876543210",
        distance: 1.2,
        rating: 4.2,
        lat: 28.6139, // Default coordinates (will be updated based on user's location)
        lng: 77.2090
    },
    {
        id: 2,
        name: "Women's Safety Police Station",
        type: "women",
        address: "456 Park Avenue, Safety District",
        phone: "+91 9876543211",
        distance: 2.5,
        rating: 4.7,
        lat: 28.6219,
        lng: 77.2160
    },
    {
        id: 3,
        name: "Highway Traffic Police",
        type: "traffic",
        address: "789 Highway Road, Traffic Junction",
        phone: "+91 9876543212",
        distance: 3.1,
        rating: 3.9,
        lat: 28.6100,
        lng: 77.2300
    },
    {
        id: 4,
        name: "East District Police Station",
        type: "police",
        address: "234 East Road, East District",
        phone: "+91 9876543213",
        distance: 3.8,
        rating: 4.0,
        lat: 28.6300,
        lng: 77.2400
    },
    {
        id: 5,
        name: "South Women's Police Station",
        type: "women",
        address: "567 South Boulevard, South District",
        phone: "+91 9876543214",
        distance: 4.2,
        rating: 4.5,
        lat: 28.5900,
        lng: 77.2200
    }
];

// Variables to store map instance and user's current location
let map;
let userLocation = null;
let markers = [];
let infoWindows = [];

// Initialize the police stations functionality
document.addEventListener('DOMContentLoaded', function() {
    initLocationDetection();
    initFilters();
});

// Initialize the location detection
function initLocationDetection() {
    const detectLocationBtn = document.getElementById('detectLocationBtn');
    const manualLocationInput = document.getElementById('manualLocation');
    const searchLocationBtn = document.getElementById('searchLocationBtn');

    if (!detectLocationBtn || !manualLocationInput || !searchLocationBtn) return;

    // Detect location button click
    detectLocationBtn.addEventListener('click', function() {
        if (navigator.geolocation) {
            // Show loading state
            showLoadingState();
            
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    // Success - got the location
                    userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    
                    // Get the address from coordinates and display
                    getAddressFromCoordinates(userLocation.lat, userLocation.lng)
                        .then(address => {
                            manualLocationInput.value = address || `${userLocation.lat.toFixed(6)}, ${userLocation.lng.toFixed(6)}`;
                            searchNearbyPoliceStations();
                        });
                },
                function(error) {
                    // Error getting location
                    hideLoadingState();
                    console.error("Error getting location:", error);
                    showErrorMessage("Could not detect your location. Please enter it manually.");
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        } else {
            showErrorMessage("Geolocation is not supported by this browser.");
        }
    });

    // Search location button click
    searchLocationBtn.addEventListener('click', function() {
        const address = manualLocationInput.value.trim();
        if (!address) {
            showErrorMessage("Please enter a location or use detect location.");
            return;
        }

        showLoadingState();
        getCoordinatesFromAddress(address)
            .then(coordinates => {
                if (coordinates) {
                    userLocation = coordinates;
                    searchNearbyPoliceStations();
                } else {
                    hideLoadingState();
                    showErrorMessage("Could not find coordinates for this address. Please try a different one.");
                }
            })
            .catch(error => {
                hideLoadingState();
                showErrorMessage("Error searching for location. Please try again.");
                console.error("Error:", error);
            });
    });

    // Allow pressing Enter in the input field
    manualLocationInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchLocationBtn.click();
        }
    });
}

// Initialize the filters
function initFilters() {
    const distanceFilter = document.getElementById('distanceFilter');
    const typeFilter = document.getElementById('typeFilter');
    
    if (!distanceFilter || !typeFilter) return;

    // Add event listeners for filters
    distanceFilter.addEventListener('change', applyFilters);
    typeFilter.addEventListener('change', applyFilters);
}

// Apply filters to the police stations list
function applyFilters() {
    const distanceFilter = document.getElementById('distanceFilter');
    const typeFilter = document.getElementById('typeFilter');
    
    if (!distanceFilter || !typeFilter) return;
    
    const maxDistance = parseInt(distanceFilter.value) || 100;
    const stationType = typeFilter.value;

    // Filter stations based on criteria
    let filteredStations = [...mockPoliceStations];
    
    // Apply distance filter
    filteredStations = filteredStations.filter(station => station.distance <= maxDistance);
    
    // Apply type filter if specific type selected
    if (stationType !== 'all') {
        filteredStations = filteredStations.filter(station => station.type === stationType);
    }
    
    // Sort by distance
    filteredStations.sort((a, b) => a.distance - b.distance);
    
    // Update the UI
    renderStationsList(filteredStations);
    updateMapMarkers(filteredStations);
}

// Search for nearby police stations
function searchNearbyPoliceStations() {
    if (!userLocation) {
        hideLoadingState();
        showErrorMessage("Location not available. Please try again.");
        return;
    }

    // In a real app, we would make an API call to get nearby police stations
    // For this demo, we'll use our mock data but adjust distances based on user location
    
    // Simulate calculating distances from user location
    const stations = mockPoliceStations.map(station => {
        // Calculate a somewhat realistic distance based on coordinates
        // This is a simple calculation and not accurate for real-world use
        const distance = calculateDistance(
            userLocation.lat, userLocation.lng,
            station.lat, station.lng
        );
        
        return {
            ...station,
            distance: distance
        };
    });
    
    // Sort stations by distance
    stations.sort((a, b) => a.distance - b.distance);
    
    // Simulate a delay to show loading state
    setTimeout(() => {
        hideLoadingState();
        showResultsSection();
        
        // Show the map container
        const mapContainer = document.getElementById('mapContainer');
        if (mapContainer) mapContainer.style.display = 'block';
        
        // Display the stations
        renderStationsList(stations);
        
        // Initialize the map
        initMap(stations);
    }, 1500);
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return parseFloat(distance.toFixed(1));
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

// Render the list of police stations
function renderStationsList(stations) {
    const stationsListElement = document.querySelector('.stations-list');
    if (!stationsListElement) return;

    if (stations.length === 0) {
        stationsListElement.innerHTML = `
            <div class="no-results">
                <i class="fas fa-exclamation-circle"></i>
                <h3>No police stations found</h3>
                <p>Try changing your filters or search in a different location.</p>
            </div>
        `;
        return;
    }

    stationsListElement.innerHTML = '';
    stations.forEach(station => {
        // Create stars for rating
        const fullStars = Math.floor(station.rating);
        const halfStar = station.rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        
        let starsHTML = '';
        for (let i = 0; i < fullStars; i++) starsHTML += '<i class="fas fa-star"></i>';
        if (halfStar) starsHTML += '<i class="fas fa-star-half-alt"></i>';
        for (let i = 0; i < emptyStars; i++) starsHTML += '<i class="far fa-star"></i>';

        const stationTypeClass = station.type === 'women' ? 'women-station' : 
                               station.type === 'traffic' ? 'traffic-station' : '';
                               
        const stationTypeLabel = station.type === 'women' ? 'Women Safety' : 
                               station.type === 'traffic' ? 'Traffic Police' : 'Police Station';
                               
        const stationTypeClass2 = station.type === 'women' ? 'women-type' : 
                                station.type === 'traffic' ? 'traffic-type' : 'police-type';

        const stationCard = document.createElement('div');
        stationCard.className = `station-card ${stationTypeClass}`;
        stationCard.innerHTML = `
            <div class="station-header">
                <h3>${station.name}</h3>
                <span class="station-type ${stationTypeClass2}">${stationTypeLabel}</span>
            </div>
            <div class="station-details">
                <div class="station-info">
                    <p><i class="fas fa-map-marker-alt"></i> ${station.address}</p>
                    <p><i class="fas fa-phone"></i> ${station.phone}</p>
                    <p><i class="fas fa-road"></i> ${station.distance} km away</p>
                    <div class="station-rating">
                        <span class="rating-stars">${starsHTML}</span>
                        <span class="rating-value">${station.rating}</span>
                    </div>
                </div>
                <div class="station-actions">
                    <button class="btn btn-primary btn-sm" onclick="showDirections(${station.id})">
                        <i class="fas fa-directions"></i> Directions
                    </button>
                    <button class="btn btn-success btn-sm" onclick="callStation('${station.phone}')">
                        <i class="fas fa-phone-alt"></i> Call
                    </button>
                </div>
            </div>
        `;
        
        stationsListElement.appendChild(stationCard);
    });
}

// Initialize the map
function initMap(stations) {
    const mapContainer = document.getElementById('policeStationsMap');
    if (!mapContainer) return;
    
    // Clear previous map
    mapContainer.innerHTML = '';
    
    // For this demo, we'll create a mock map implementation
    // In a real implementation, you would use the Google Maps API
    
    // Create a mock map container
    mapContainer.style.background = '#e5e3df';
    mapContainer.style.position = 'relative';
    mapContainer.style.overflow = 'hidden';
    
    // Add a mock map UI
    mapContainer.innerHTML = `
        <div style="position: absolute; top: 10px; left: 10px; background: white; padding: 8px; border-radius: 2px; box-shadow: 0 1px 4px rgba(0,0,0,0.3); z-index: 10;">
            <div style="display: flex; align-items: center; gap: 5px;">
                <div style="width: 24px; height: 24px; background: #d37827; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px;">
                    <i class="fas fa-map-marker-alt"></i>
                </div>
                <span style="font-size: 14px; font-weight: 500;">Map View</span>
            </div>
        </div>
        
        <div style="position: absolute; bottom: 30px; right: 10px; display: flex; flex-direction: column; gap: 5px; z-index: 10;">
            <button style="width: 40px; height: 40px; background: white; border: none; border-radius: 2px; box-shadow: 0 1px 4px rgba(0,0,0,0.3); font-size: 18px; cursor: pointer;">+</button>
            <button style="width: 40px; height: 40px; background: white; border: none; border-radius: 2px; box-shadow: 0 1px 4px rgba(0,0,0,0.3); font-size: 18px; cursor: pointer;">−</button>
        </div>
        
        <div class="mock-map" style="width: 100%; height: 100%; position: relative; overflow: hidden;">
            <!-- Map background grid -->
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: linear-gradient(rgba(200, 200, 200, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(200, 200, 200, 0.2) 1px, transparent 1px); background-size: 20px 20px;"></div>
            
            <!-- Main roads -->
            <div style="position: absolute; top: 50%; left: 0; right: 0; height: 10px; background: rgba(255, 255, 255, 0.8); transform: translateY(-50%);"></div>
            <div style="position: absolute; top: 0; left: 50%; bottom: 0; width: 10px; background: rgba(255, 255, 255, 0.8); transform: translateX(-50%);"></div>
            
            <!-- User location indicator -->
            <div class="user-location-marker" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 20px; height: 20px; background: #4285F4; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); z-index: 5;"></div>
        </div>
    `;
    
    // Create a mock map object for the script to use
    map = {
        markers: []
    };
    
    // Add station markers to the mock map
    const mockMap = mapContainer.querySelector('.mock-map');
    if (mockMap) {
        stations.forEach((station, index) => {
            // Create a mock marker element
            const marker = document.createElement('div');
            marker.className = 'station-marker';
            marker.style.position = 'absolute';
            
            // Calculate position based on distance and a random angle
            const angle = (index * 60) % 360; // Distribute markers around the user
            const distance = station.distance * 10; // Scale distance for display
            const maxDistance = Math.min(mockMap.offsetWidth, mockMap.offsetHeight) / 3;
            const clampedDistance = Math.min(distance, maxDistance);
            
            const x = 50 + (Math.cos(angle * Math.PI / 180) * clampedDistance / maxDistance * 30);
            const y = 50 + (Math.sin(angle * Math.PI / 180) * clampedDistance / maxDistance * 30);
            
            marker.style.top = `${y}%`;
            marker.style.left = `${x}%`;
            marker.style.transform = 'translate(-50%, -50%)';
            marker.style.width = '30px';
            marker.style.height = '30px';
            marker.style.zIndex = '4';
            
            // Color based on station type
            let markerColor = '#0d6efd'; // Default blue for regular police
            if (station.type === 'women') markerColor = '#dc3545'; // Red for women's station
            if (station.type === 'traffic') markerColor = '#ffc107'; // Yellow for traffic
            
            marker.innerHTML = `
                <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: white; background: ${markerColor}; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
                    <i class="fas fa-shield-alt" style="font-size: 14px;"></i>
                </div>
                <div style="position: absolute; bottom: -25px; left: 50%; transform: translateX(-50%); white-space: nowrap; background: white; padding: 2px 5px; border-radius: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.2); font-size: 10px;">
                    ${station.name}
                </div>
            `;
            
            // Add click event for info window
            marker.addEventListener('click', () => {
                // Remove any existing info windows
                const existingInfos = mockMap.querySelectorAll('.mock-info-window');
                existingInfos.forEach(info => info.remove());
                
                // Create info window
                const infoWindow = document.createElement('div');
                infoWindow.className = 'mock-info-window';
                infoWindow.style.position = 'absolute';
                infoWindow.style.top = `${y - 10}%`;
                infoWindow.style.left = `${x}%`;
                infoWindow.style.transform = 'translate(-50%, -100%)';
                infoWindow.style.background = 'white';
                infoWindow.style.borderRadius = '4px';
                infoWindow.style.padding = '10px';
                infoWindow.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
                infoWindow.style.zIndex = '10';
                infoWindow.style.minWidth = '200px';
                infoWindow.style.maxWidth = '250px';
                
                infoWindow.innerHTML = `
                    <div style="text-align: left;">
                        <div style="margin-bottom: 5px; font-weight: bold;">${station.name}</div>
                        <div style="margin-bottom: 5px; font-size: 12px;">${station.address}</div>
                        <div style="margin-bottom: 5px; font-size: 12px;">${station.phone}</div>
                        <div style="margin-bottom: 5px; font-size: 12px;">${station.distance} km away</div>
                        <div style="display: flex; gap: 5px; margin-top: 10px;">
                            <button onclick="showDirections(${station.id})" style="flex: 1; padding: 5px; background: #0d6efd; color: white; border: none; border-radius: 3px; font-size: 12px; cursor: pointer;">
                                Directions
                            </button>
                            <button onclick="callStation('${station.phone}')" style="flex: 1; padding: 5px; background: #d37827; color: white; border: none; border-radius: 3px; font-size: 12px; cursor: pointer;">
                                Call
                            </button>
                        </div>
                    </div>
                    <button class="close-info" style="position: absolute; top: 5px; right: 5px; background: none; border: none; font-size: 16px; cursor: pointer; color: #666;">×</button>
                `;
                
                mockMap.appendChild(infoWindow);
                
                // Close button functionality
                const closeButton = infoWindow.querySelector('.close-info');
                if (closeButton) {
                    closeButton.addEventListener('click', () => {
                        infoWindow.remove();
                    });
                }
            });
            
            mockMap.appendChild(marker);
            map.markers.push(marker); // Store reference to the marker
        });
    }
    
    // Add an info text to indicate this is a demo
    const infoText = document.createElement('div');
    infoText.style.position = 'absolute';
    infoText.style.bottom = '10px';
    infoText.style.left = '10px';
    infoText.style.background = 'rgba(255, 255, 255, 0.8)';
    infoText.style.padding = '5px 10px';
    infoText.style.borderRadius = '4px';
    infoText.style.fontSize = '12px';
    infoText.style.color = '#666';
    infoText.style.zIndex = '10';
    infoText.innerHTML = 'Demo Map - In a real app, this would use Google Maps API';
    
    mapContainer.appendChild(infoText);
}

// Add a marker for a police station - This is a mock implementation
function addStationMarker(station) {
    // Our mock implementation is handled directly in initMap
    // This function is kept for API compatibility but doesn't do anything in the mock version
}

// Update map markers based on filtered stations
function updateMapMarkers(filteredStations) {
    if (!map) return;
    
    // Clear existing mock markers
    if (map.markers) {
        map.markers.forEach(marker => {
            if (marker.parentNode) {
                marker.parentNode.removeChild(marker);
            }
        });
    }
    map.markers = [];
    
    // Reinitialize the map with filtered stations
    initMap(filteredStations);
}

// Show directions to a station
function showDirections(stationId) {
    const station = mockPoliceStations.find(s => s.id === stationId);
    if (!station || !userLocation) return;
    
    // In a real implementation, this would open Google Maps with directions
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${station.lat},${station.lng}&travelmode=driving`;
    window.open(url, '_blank');
}

// Call a police station
function callStation(phoneNumber) {
    // In a real implementation, this would initiate a phone call
    window.location.href = `tel:${phoneNumber}`;
}

// Get address from coordinates using reverse geocoding
function getAddressFromCoordinates(lat, lng) {
    // In a real implementation, this would use the Google Maps Geocoding API
    // For this demo, we'll return a promise that resolves with a mock address
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(`Near ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }, 500);
    });
}

// Get coordinates from address using geocoding
function getCoordinatesFromAddress(address) {
    // In a real implementation, this would use the Google Maps Geocoding API
    // For this demo, we'll return a promise that resolves with mock coordinates
    return new Promise(resolve => {
        setTimeout(() => {
            // Generate slightly random coordinates
            const lat = 28.6129 + (Math.random() - 0.5) * 0.1;
            const lng = 77.2295 + (Math.random() - 0.5) * 0.1;
            resolve({ lat, lng });
        }, 800);
    });
}

// Show loading state
function showLoadingState() {
    const loadingElement = document.querySelector('.stations-loading');
    const resultsElement = document.querySelector('.stations-results-content');
    
    if (loadingElement) loadingElement.style.display = 'flex';
    if (resultsElement) resultsElement.style.display = 'none';
}

// Hide loading state
function hideLoadingState() {
    const loadingElement = document.querySelector('.stations-loading');
    if (loadingElement) loadingElement.style.display = 'none';
}

// Show results section
function showResultsSection() {
    const resultsElement = document.querySelector('.stations-results-content');
    if (resultsElement) resultsElement.style.display = 'block';
}

// Show error message
function showErrorMessage(message) {
    alert(message); // Simple implementation - could be enhanced with a toast or custom message box
}