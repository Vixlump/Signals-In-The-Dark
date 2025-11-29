// Global state variables
let data = [];
let topN = 15;
let loading = false;
const vizRootId = 'viz-root';

// Sample data (same as before)
const SAMPLE_DATA = `
,Unnamed: 0,Company Name,Location,Datum,Detail,Status Rocket, Rocket,Status Mission
0,0,SpaceX,"LC-39A, Kennedy Space Center, Florida, USA","Fri Aug 07, 2020 05:12 UTC",Falcon 9 Block 5 | Starlink V1 L9 & BlackSky,StatusActive,50.0 ,Success
1,1,CASC,"Site 9401 (SLS-2), Jiuquan Satellite Launch Center, China","Thu Aug 06, 2020 04:01 UTC",Long March 2D | Gaofen-9 04 & Q-SAT,StatusActive,29.75 ,Success
2,2,SpaceX,"Pad A, Boca Chica, Texas, USA","Tue Aug 04, 2020 23:57 UTC",Starship Prototype | 150 Meter Hop,StatusActive,,Success
3,3,Roscosmos,"Site 200/39, Baikonur Cosmodrome, Kazakhstan","Thu Jul 30, 2020 21:25 UTC",Proton-M/Briz-M | Ekspress-80 & Ekspress-103,StatusActive,65.0 ,Success
4,4,ULA,"SLC-41, Cape Canaveral AFS, Florida, USA","Thu Jul 30, 2020 11:50 UTC",Atlas V 541 | Perseverance,StatusActive,145.0 ,Success
5,5,CASC,"LC-9, Taiyuan Satellite Launch Center, China","Sat Jul 25, 2020 03:13 UTC",Long March 4B | Ziyuan-3 03,StatusActive,64.68 ,Success
6,6,Roscosmos,"Site 31/6, Baikonur Cosmodrome, Kazakhstan","Thu Jul 23, 2020 14:26 UTC",Soyuz 2.1a | Progress MS-15,StatusActive,48.5 ,Success
100,100,NASA,"LC-39A, Kennedy Space Center, Florida, USA","Mon Nov 09, 1967 12:00 UTC",Saturn V | Apollo 4,StatusRetired,,Success
101,101,NASA,"LC-39A, Kennedy Space Center, Florida, USA","Mon Nov 09, 1969 12:00 UTC",Saturn V | Apollo 11,StatusRetired,,Success
102,102,RVSN USSR,"Site 1/5, Baikonur Cosmodrome, Kazakhstan","Fri May 15, 1958 07:12 UTC",Sputnik 8A91 | Sputnik-3 #2,StatusRetired,,Success
103,103,US Navy,"LC-18A, Cape Canaveral AFS, Florida, USA","Mon Apr 28, 1958 02:53 UTC",Vanguard | Vanguard TV5,StatusRetired,,Failure
104,104,RVSN USSR,"Site 1/5, Baikonur Cosmodrome, Kazakhstan","Sun Apr 27, 1958 09:01 UTC",Sputnik 8A91 | Sputnik-3 #1,StatusRetired,,Failure
`;

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
 * Handles the file upload event to load a new CSV dataset.
 * @param {Event} event 
 */
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        setLoadingState(true); // Start loading animation
        const reader = new FileReader();
        reader.onload = (e) => parseCSV(e.target.result);
        reader.onerror = (e) => {
            console.error("Error reading file:", e);
            setLoadingState(false);
        };
        reader.readAsText(file);
    }
}

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
        "mark": "circle",
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

    // Clear and build the UI structure
    root.innerHTML = '';
    root.style.width = '100%';

    // --- 1. Controls Container ---
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'viz-controls';
    
    // File Upload Control
    const fileWrapper = document.createElement('div');
    fileWrapper.className = 'file-input-wrapper';
    fileWrapper.innerHTML = `
        <label for="file-upload">Load Full CSV Dataset</label>
        <input 
            id="file-upload"
            type="file" 
            accept=".csv" 
        />
    `;
    const fileInput = fileWrapper.querySelector('#file-upload');
    fileInput.addEventListener('change', handleFileUpload);

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
        renderUI(); // Re-render UI to update chart
    });

    controlsDiv.appendChild(fileWrapper);
    controlsDiv.appendChild(selectWrapper);
    root.appendChild(controlsDiv);

    // --- 2. Loading State ---
    if (loading) {
        const loadingDiv = document.createElement('div');
        loadingDiv.style.cssText = `
            color: #6a9eff;
            text-align: center;
            padding: 2rem;
            font-size: 1.2rem;
            font-weight: bold;
            animation: pulse 1.5s infinite; /* Assumes pulse is defined in CSS/style tag */
        `;
        loadingDiv.textContent = 'Processing data for visualization... This might take a moment if the file is large.';
        root.appendChild(loadingDiv);
    }

    // --- 3. Vega-Lite Container ---
    const vizDiv = document.createElement('div');
    vizDiv.id = 'viz';
    vizDiv.style.width = '100%';
    vizDiv.style.overflowX = 'auto';
    root.appendChild(vizDiv);
    
    // Call renderChart here, which will use the vizDiv ID
    if (!loading) {
        renderChart();
    }

    // --- 4. Caption ---
    const captionDiv = document.createElement('div');
    captionDiv.className = 'viz-caption';
    // Use LaTeX syntax for math in the caption
    captionDiv.innerHTML = `
        <span>High Success Rate ($$\\approx 100\\%$$) appears in Blue.</span>
        <span>High Failure Rate ($$\\approx 0\\%$$) appears in Red.</span>
    `;
    root.appendChild(captionDiv);
}

/**
 * Initialization function called when the DOM is ready.
 */
function init() {
    // 1. Load sample data initially
    setLoadingState(true);
    parseCSV(SAMPLE_DATA);

    // 2. Initial render of the UI elements
    // The renderUI call will eventually call renderChart once data is parsed.
    renderUI(); 
}

// Start the application when the window is loaded
window.addEventListener('load', init);