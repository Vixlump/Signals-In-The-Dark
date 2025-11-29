// Global state variables
let data = [];
let topN = 15;
let loading = false;
const vizRootId = 'viz-root';
// CORRECTED PATH: using 'dataset' (singular) as requested
const DATA_FILE_PATH = 'dataset/Space_Corrected.csv'; 

/**
 * Updates the global loading state and refreshes the UI display.
 * @param {boolean} isLoading 
 */
function setLoadingState(isLoading) {
    loading = isLoading;
    renderUI();
}

/**
 * Parses the raw CSV text using PapaParse and updates the global data state.
 * @param {string} csvText 
 */
function parseCSV(csvText) {
    if (typeof Papa === 'undefined') {
        console.error("PapaParse is not loaded. Cannot process CSV.");
        setLoadingState(false);
        return;
    }
    
    Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
            const processed = results.data.map(d => {
                const dateObj = new Date(d.Datum);
                // Ensure date parsing is robust, if the date is invalid, Year will be null
                const year = isNaN(dateObj) ? null : dateObj.getFullYear();
                return {
                    // Spread other data fields
                    ...d,
                    Year: year,
                    Company: d["Company Name"],
                    // Convert success status to a binary 1 or 0 for easier calculation
                    IsSuccess: d["Status Mission"] === "Success" ? 1 : 0
                };
            }).filter(d => d.Year !== null && d.Company); // Filter out rows with invalid dates or missing company names

            data = processed;
            setLoadingState(false); // Stop loading animation
            renderChart();        // Render the chart with new data
        },
        error: (err) => {
            console.error("Error parsing CSV:", err);
            setLoadingState(false);
        }
    });
}

/**
 * Loads the initial CSV data from the specified path using fetch.
 */
async function loadData() {
    setLoadingState(true);
    try {
        // Implement exponential backoff for robust fetching
        const maxRetries = 3;
        let response = null;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                response = await fetch(DATA_FILE_PATH);
                if (response.ok) break; // Success!
            } catch (e) {
                // Network error, try again after delay
                if (attempt < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                } else {
                    throw e; // Throw the last error if all retries fail
                }
            }
        }
        
        if (!response || !response.ok) {
            throw new Error(`HTTP error! status: ${response ? response.status : 'No response'}`);
        }
        
        const csvText = await response.text();
        parseCSV(csvText);
    } catch (error) {
        console.error("Failed to load initial data from CSV:", error);
        // Display an error message to the user
        const root = document.getElementById(vizRootId);
        if (root) {
             const vizDiv = root.querySelector('#viz');
             if (vizDiv) {
                 vizDiv.innerHTML = `<p style="color: red; padding: 20px; text-align: center;">Error loading data from ${DATA_FILE_PATH}. Please ensure the file exists in the 'dataset' folder.</p>`;
             }
        }
        setLoadingState(false);
    }
}

// The handleFileUpload function has been removed as file upload is no longer needed.

/**
 * Recalculates the aggregated data needed for the Punchcard chart.
 * @returns {Array<Object>} Aggregated data for Vega-Lite.
 */
function getChartData() {
    if (data.length === 0) return [];
    
    // 1. Calculate top N companies based on total mission count
    const companyCounts = {};
    data.forEach(d => {
        companyCounts[d.Company] = (companyCounts[d.Company] || 0) + 1;
    });
    const topCompanies = Object.entries(companyCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, topN)
        .map(entry => entry[0]);

    // 2. Aggregate mission performance by Company and Year
    const aggMap = {};
    data.forEach(d => {
        // Only include data for the top N companies
        if (!topCompanies.includes(d.Company)) return;
        
        const key = `${d.Company}-${d.Year}`;
        if (!aggMap[key]) {
            aggMap[key] = { Company: d.Company, Year: d.Year, Total: 0, Successes: 0, Failures: 0 };
        }
        
        aggMap[key].Total += 1;
        if (d.IsSuccess) {
            aggMap[key].Successes += 1;
        } else {
            aggMap[key].Failures += 1;
        }
    });

    // 3. Calculate Success Rate
    return Object.values(aggMap).map(item => ({
        ...item,
        SuccessRate: item.Successes / item.Total
    }));
}

/**
 * Generates the Vega-Lite specification and embeds the chart into the DOM.
 */
function renderChart() {
    const chartData = getChartData();
    const vizContainer = document.getElementById('viz');
    
    // Clear previous content
    if (vizContainer) vizContainer.innerHTML = '';
    
    if (chartData.length === 0) {
        if (vizContainer) vizContainer.innerHTML = '<p style="color:#b0c4ff; padding:20px; text-align:center;">No data available to render the chart.</p>';
        return;
    }

    if (typeof vegaEmbed === 'undefined') {
        console.error("VegaEmbed is not loaded. Cannot render chart.");
        return;
    }

    const spec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "data": { "values": chartData },
        "background": "transparent",
        "width": "container",
        "height": 500,
        // DARK MODE CONFIGURATION
        "config": {
            "font": "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            "axis": { 
                "domainColor": "#b0c4ff", 
                "gridColor": "rgba(106, 158, 255, 0.2)",
                "tickColor": "#b0c4ff", 
                "labelColor": "#e0e0ff", 
                "titleColor": "#6a9eff" 
            },
            "legend": { 
                "labelColor": "#e0e0ff", 
                "titleColor": "#6a9eff",
                "orient": "bottom",
                "direction": "horizontal",
                "titlePadding": 10
            },
            "title": { "color": "#6a9eff", "fontSize": 18, "fontWeight": 600, "anchor": "middle" },
            "view": { "stroke": "transparent" }
        },
        "title": `Mission Performance Timeline (Top ${topN} Companies)`,
        // UPDATED: Set the mark type and explicitly set a white stroke for visibility
        "mark": {"type": "circle", "stroke": "#FFFFFF", "strokeWidth": 1},
        "encoding": {
            "x": {
                "field": "Year",
                "type": "quantitative",
                "scale": { "zero": false, "domain": [1957, new Date().getFullYear()] },
                "axis": { "format": "d", "tickMinStep": 1, "labelOverlap": "greedy" },
                "title": "Year of Launch"
            },
            "y": {
                "field": "Company",
                "type": "nominal",
                "sort": {"op": "sum", "field": "Total", "order": "descending"},
                "title": null
            },
            "size": {
                "field": "Total",
                "type": "quantitative",
                "title": "Missions per Year",
                "scale": { "range": [50, 600] },
                "legend": { "orient": "bottom", "direction": "horizontal", "titlePadding": 10 }
            },
            "color": {
                "field": "SuccessRate",
                "type": "quantitative",
                "scale": { "scheme": "redyellowblue", "domain": [0, 1] },
                "title": "Success Rate",
                "legend": { "format": "%", "orient": "bottom", "direction": "horizontal", "titlePadding": 10 }
            },
            "tooltip": [
                { "field": "Company", "type": "nominal" },
                { "field": "Year", "type": "quantitative" },
                { "field": "Total", "title": "Total Missions" },
                { "field": "Successes", "title": "Successful" },
                { "field": "Failures", "title": "Failed" },
                { "field": "SuccessRate", "title": "Success Rate", "format": ".1%" }
            ]
        }
    };

    vegaEmbed('#viz', spec, { actions: false });
}

/**
 * Renders or updates the entire UI within the viz-root container using pure JavaScript.
 */
function renderUI() {
    const root = document.getElementById(vizRootId);
    if (!root) {
        console.error(`Root element with ID ${vizRootId} not found.`);
        return;
    }

    // Locate or create UI elements
    let controlsDiv = root.querySelector('.viz-controls');
    let vizDiv = root.querySelector('#viz');
    let captionDiv = root.querySelector('.viz-caption');

    if (!controlsDiv) {
        // --- 1. Controls Container (Create if not exists) ---
        controlsDiv = document.createElement('div');
        controlsDiv.className = 'viz-controls';
        
        // Top N Select Control
        const selectWrapper = document.createElement('div');
        const options = [10, 15, 20, 30];
        const selectHtml = `
            <label for="company-select">Top N Companies</label>
            <select id="company-select">
                ${options.map(n => `<option value="${n}" ${n === topN ? 'selected' : ''}>Top ${n}</option>`).join('')}
            </select>
        `;
        selectWrapper.innerHTML = selectHtml;
        const selectElement = selectWrapper.querySelector('#company-select');
        selectElement.addEventListener('change', (e) => {
            topN = Number(e.target.value);
            // Only re-render the chart if data is loaded
            if (!loading && data.length > 0) renderChart(); 
        });

        // Only append the select control
        controlsDiv.appendChild(selectWrapper);
        root.prepend(controlsDiv); // Add to the top
    } else {
        // Update select value if topN changed
        const selectElement = controlsDiv.querySelector('#company-select');
        if (selectElement) {
             selectElement.value = topN;
        }
    }


    // Ensure vizDiv and captionDiv exist for updates
    if (!vizDiv) {
        vizDiv = document.createElement('div');
        vizDiv.id = 'viz';
        vizDiv.style.width = '100%';
        vizDiv.style.overflowX = 'auto';
        root.appendChild(vizDiv);
    }

    if (!captionDiv) {
        captionDiv = document.createElement('div');
        captionDiv.className = 'viz-caption';
        captionDiv.innerHTML = `
            <span>High Success Rate (between 80%-100%) appears in Blue.</span>
            <span>High Failure Rate (between 0%-20%) appears in Red.</span>
        `;
        root.appendChild(captionDiv);
    }
    
    // --- 2. Loading State / Chart Render ---
    if (loading) {
        vizDiv.innerHTML = `<p style="color: #6a9eff; text-align: center; padding: 2rem; font-size: 1.2rem; font-weight: bold; animation: pulse 1.5s infinite;">Processing data for visualization...</p>`;
    } else if (data.length > 0) {
        // Clear loading message if data is now ready
        if (vizDiv.innerHTML.includes('Processing data')) {
             vizDiv.innerHTML = '';
        }
    } else {
         vizDiv.innerHTML = '<p style="color:#b0c4ff; padding:20px; text-align:center;">Data is loading or failed to load. Please check console for errors.</p>';
    }
}

/**
 * Initialization function called when the DOM is ready.
 */
function init() {
    // 1. Initial render of the UI elements (before data is loaded)
    renderUI(); 
    
    // 2. Load the CSV data automatically
    loadData();
}

// Start the application when the window is loaded
window.addEventListener('load', init);