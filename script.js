const svgContainer = document.getElementById("map");
const container = document.getElementById("map-container");
const zoomInButton = document.getElementById("zoom-in");
const zoomOutButton = document.getElementById("zoom-out");
const resetButton = document.getElementById("reset-view");
const searchInput = document.getElementById("search-input");
const infoBox = document.getElementById("info-box");

let transform = { scale: 1, x: 0, y: 0 };
let locations = [];

// Load the external SVG file
fetch("map.svg")
    .then(response => response.text())
    .then(data => {
        svgContainer.innerHTML = data;
        const bbox = svgContainer.getBBox();
        svgContainer.setAttribute("viewBox", `0 0 ${bbox.width} ${bbox.height}`);
        initZoomAndPan();
        loadLocations(); // Load locations after SVG is loaded
    })
    .catch(err => console.error("Error loading SVG:", err));

// Load locations from JSON
function loadLocations() {
    fetch('locations.json')
        .then(response => response.json())
        .then(data => {
            locations = data;
            locations.forEach(location => {
                // Create markers
                const marker = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                marker.setAttribute("cx", location.coordinates.x);
                marker.setAttribute("cy", location.coordinates.y);
                marker.setAttribute("class", `marker ${location.type}`); // Add class based on type

                marker.dataset.name = location.name;
                marker.dataset.importance = location.importance;
                marker.dataset.info = location.info;

                // Add marker to the SVG
                svgContainer.appendChild(marker);

                // Add event listener for showing info box when clicking on a marker
                marker.addEventListener("click", () => {
                    showInfoBox(location);
                });
            });
        })
        .catch(err => console.error("Error loading locations:", err));
}

// Show the info box with location info
function showInfoBox(location) {
    infoBox.style.display = 'block';
    infoBox.innerHTML = `
        <h3>${location.name}</h3>
        <p>${location.info}</p>
    `;
    infoBox.style.left = `${location.coordinates.x + 20}px`;
    infoBox.style.top = `${location.coordinates.y + 20}px`;
}

// Hide the info box when clicking anywhere on the map
container.addEventListener("click", (event) => {
    if (event.target === svgContainer) {
        infoBox.style.display = 'none';
    }
});

// Zoom and pan functionality
function initZoomAndPan() {
    let isPanning = false;
    let startX, startY;

    const updateTransform = () => {
        svgContainer.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`;
        updateMarkerVisibility(); // Check marker visibility on zoom
    };

    container.addEventListener("mousedown", (event) => {
        isPanning = true;
        startX = event.clientX - transform.x;
        startY = event.clientY - transform.y;
        event.preventDefault();
    });

    container.addEventListener("mousemove", (event) => {
        if (!isPanning) return;
        transform.x = event.clientX - startX;
        transform.y = event.clientY - startY;
        updateTransform();
    });

    container.addEventListener("mouseup", () => {
        isPanning = false;
    });

    container.addEventListener("mouseleave", () => {
        isPanning = false;
    });

    container.addEventListener("wheel", (event) => {
        event.preventDefault();

        const zoomFactor = 0.1;
        const deltaScale = event.deltaY > 0 ? -zoomFactor : zoomFactor;
        const newScale = Math.min(Math.max(transform.scale + deltaScale, 0.5), 10);

        const mouseX = event.clientX;
        const mouseY = event.clientY;
        const rect = container.getBoundingClientRect();

        const scaleRatio = newScale / transform.scale;
        transform.x = mouseX - (mouseX - transform.x) * scaleRatio;
        transform.y = mouseY - (mouseY - transform.y) * scaleRatio;
        transform.scale = newScale;

        updateTransform();
    });

    zoomInButton.addEventListener("click", () => {
        transform.scale = Math.min(transform.scale + 0.1, 10);
        updateTransform();
    });

    zoomOutButton.addEventListener("click", () => {
        transform.scale = Math.max(transform.scale - 0.1, 0.5);
        updateTransform();
    });

    resetButton.addEventListener("click", () => {
        transform = { scale: 1, x: 0, y: 0 };
        updateTransform();
    });
}

// Update marker visibility based on zoom level
function updateMarkerVisibility() {
    const markers = document.querySelectorAll(".marker");
    markers.forEach(marker => {
        const importance = parseInt(marker.dataset.importance);
        const scaleThreshold = (6 - importance) * 0.5;
        if (transform.scale >= scaleThreshold) {
            marker.style.display = "block";
        } else {
            marker.style.display = "none";
        }
    });
}

// Search functionality
searchInput.addEventListener("input", (e) => {
    const term = e.target.value.trim();
    const location = locations.find(l => l.name.toLowerCase().includes(term.toLowerCase()));
    if (location) {
        transform.x = location.coordinates.x - container.offsetWidth / 2;
        transform.y = location.coordinates.y - container.offsetHeight / 2;
        transform.scale = 3; // Zoom into the location
        updateTransform();
    }
});
