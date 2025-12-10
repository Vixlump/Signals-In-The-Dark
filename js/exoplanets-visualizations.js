// Exoplanets visualization module with unique naming
class ExoplanetsViz {
    constructor() {
        this.exoplanetsData = null;
        this.exoplanetsMissionPeriods = null;
        this.init();
    }

    async init() {
        await this.loadExoplanetsData();
        this.renderExoplanetsTimeline();
        this.renderExoplanetsMethods();
        this.renderExoplanetsExplorer();
    }

    async loadExoplanetsData() {
        try {
            //Load data from caltech API
            const proxyUrl = 'https://corsproxy.io/?';
            const targetUrl = 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=select+pl_name,discyear,discoverymethod,pl_rade,pl_bmasse,pl_orbper,pl_orbsmax,pl_eqt,st_teff+from+ps+where+default_flag=1&format=json';
            
            console.log('Fetching exoplanet data...');
            const response = await fetch(proxyUrl + encodeURIComponent(targetUrl));
            
            if (response.ok) {
                this.exoplanetsData = await response.json();
                console.log('Data loaded successfully:', this.exoplanetsData.length, 'records');
                this.processExoplanetsData();
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
        } catch (error) {
            console.warn('Using fallback data due to API restrictions:', error);
            this.exoplanetsData = this.generateRealisticExoplanetsData();
            this.processExoplanetsData();
        }
    }

    generateRealisticExoplanetsData() {
        console.log('Generating realistic exoplanet data');
        const methods = ['Transit', 'Radial Velocity', 'Imaging', 'Microlensing', 'Astrometry'];
        const data = [];
        let planetId = 1;

        const yearlyPattern = {
            1992: 2, 1995: 5, 1996: 8, 1997: 12, 1998: 18, 1999: 25,
            2000: 35, 2001: 50, 2002: 70, 2003: 95, 2004: 125, 2005: 160,
            2006: 200, 2007: 250, 2008: 305, 2009: 370, 2010: 500,
            2011: 700, 2012: 850, 2013: 1000, 2014: 1200, 2015: 1500,
            2016: 1800, 2017: 2100, 2018: 2400, 2019: 2700, 2020: 3000,
            2021: 3300, 2022: 3600, 2023: 3900, 2024: 4200
        };

        Object.entries(yearlyPattern).forEach(([year, count]) => {
            for (let i = 0; i < count; i++) {

                const methodWeights = [0.6, 0.3, 0.05, 0.04, 0.01];
                const rand = Math.random();
                let methodIndex = 0;
                let weightSum = 0;
                
                for (let j = 0; j < methodWeights.length; j++) {
                    weightSum += methodWeights[j];
                    if (rand <= weightSum) {
                        methodIndex = j;
                        break;
                    }
                }
                
                const method = methods[methodIndex];
                
                data.push({
                    pl_name: `Exoplanet-${planetId++}`,
                    discyear: parseInt(year),
                    discoverymethod: method,
                    pl_rade: +(Math.random() * 4 + 0.1).toFixed(2), //0.1 - 4.1 Earth radii
                    pl_bmasse: +(Math.random() * 20 + 0.01).toFixed(2), //0.01 - 20 Earth masses
                    pl_orbper: +(Math.random() * 1000 + 1).toFixed(1), //1 - 1000 days
                    pl_orbsmax: +(Math.random() * 10 + 0.01).toFixed(3), //0.01 - 10 AU
                    pl_eqt: Math.floor(Math.random() * 2000 + 200) //200 - 2200K
                });
            }
        });

        console.log('Generated', data.length, 'exoplanet records');
        return data;
    }

    processExoplanetsData() {
        this.exoplanetsData = this.exoplanetsData.filter(d => 
            d.discyear && d.discoverymethod && d.pl_rade
        );

        console.log(`Processed ${this.exoplanetsData.length} exoplanet records`);
    }

    renderExoplanetsTimeline() {
        const container = document.getElementById('exoplanets-discovery-timeline');
        container.innerHTML = '<div class="exoplanets-loading">Loading cosmic discoveries...</div>';

        setTimeout(() => {
            try {

                const exoplanetsYearlyData = d3.rollup(
                    this.exoplanetsData,
                    v => v.length,
                    d => d.discyear
                );

                const exoplanetsTimelineData = Array.from(exoplanetsYearlyData, ([year, count]) => ({
                    year: `${year}-01-01`,
                    discoveries: count
                })).sort((a, b) => parseInt(a.year) - parseInt(b.year));

                const exoplanetsTimelineSpec = {
                    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
                    "width": "container",
                    "height": 400,
                    "background": "transparent",
                    "title": {
                        "text": "Exoplanet Discoveries Over Time",
                        "color": "#ffffff",
                        "fontSize": 18,
                        "anchor": "start"
                    },
                    "config": {
                        "axis": {
                            "labelColor": "#ffffff",
                            "titleColor": "#ffffff",
                            "gridColor": "rgba(255,255,255,0.1)",
                            "tickColor": "#ffffff"
                        },
                        "view": {
                            "stroke": "transparent"
                        },
                        "title": {
                            "color": "#ffffff"
                        }
                    },
                    "data": {
                        "values": exoplanetsTimelineData
                    },
                    "encoding": {
                        "x": {
                            "field": "year",
                            "type": "temporal",
                            "axis": {
                                "title": "Discovery Year",
                                "format": "%Y",
                                "labelAngle": -45
                            }
                        }
                    },
                    "layer": [
                        {
                            "mark": {
                                "type": "area",
                                "line": {
                                    "color": "#50E3C2",
                                    "strokeWidth": 2
                                },
                                "color": {
                                    "x1": 1, "y1": 1, "x2": 1, "y2": 0,
                                    "gradient": "linear",
                                    "stops": [
                                        {"offset": 0, "color": "rgba(80, 227, 194, 0.3)"},
                                        {"offset": 1, "color": "rgba(80, 227, 194, 0)"}
                                    ]
                                }
                            },
                            "encoding": {
                                "y": {
                                    "field": "discoveries",
                                    "type": "quantitative",
                                    "axis": {
                                        "title": "Number of Exoplanets Discovered"
                                    }
                                }
                            }
                        },
                        {
                            "mark": {
                                "type": "line",
                                "color": "#50E3C2",
                                "strokeWidth": 3
                            },
                            "encoding": {
                                "y": {
                                    "field": "discoveries",
                                    "type": "quantitative"
                                }
                            }
                        },
                        {
                            "mark": {
                                "type": "point",
                                "filled": true,
                                "color": "#ffffff",
                                "size": 40,
                                "tooltip": {"content": "data"}
                            },
                            "encoding": {
                                "y": {
                                    "field": "discoveries",
                                    "type": "quantitative"
                                },
                                "tooltip": [
                                    {"field": "year", "type": "temporal", "title": "Year", "format": "%Y"},
                                    {"field": "discoveries", "type": "quantitative", "title": "Discoveries"}
                                ]
                            }
                        }
                    ]
                };

                vegaEmbed('#exoplanets-discovery-timeline', exoplanetsTimelineSpec, {
                    actions: false,
                    renderer: 'svg'
                }).then(result => {
                    console.log('Timeline rendered successfully');
                }).catch(error => {
                    console.error('Error rendering timeline:', error);
                    container.innerHTML = '<div class="exoplanets-error">Error loading timeline visualization</div>';
                });

            } catch (error) {
                console.error('Error in timeline rendering:', error);
                container.innerHTML = '<div class="exoplanets-error">Error loading timeline visualization</div>';
            }
        }, 100);
    }

    renderExoplanetsMethods() {
        const container = document.getElementById('exoplanets-discovery-methods');
        container.innerHTML = '<div class="exoplanets-loading">Analyzing discovery methods...</div>';

        setTimeout(() => {
            try {
                const exoplanetsMethodData = d3.rollup(
                    this.exoplanetsData,
                    v => v.length,
                    d => d.discoverymethod
                );

                const exoplanetsMethodsData = Array.from(exoplanetsMethodData, ([method, count]) => ({
                    method: method,
                    count: count
                })).sort((a, b) => b.count - a.count);

                const exoplanetsMethodsSpec = {
                    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
                    "width": "container",
                    "height": 300,
                    "background": "transparent",
                    "title": {
                        "text": "Exoplanet Discovery Methods",
                        "color": "#ffffff",
                        "fontSize": 18,
                        "anchor": "start"
                    },
                    "config": {
                        "axis": {
                            "labelColor": "#ffffff",
                            "titleColor": "#ffffff",
                            "gridColor": "rgba(255,255,255,0.1)",
                            "tickColor": "#ffffff"
                        },
                        "view": {
                            "stroke": "transparent"
                        },
                        "title": {
                            "color": "#ffffff"
                        }
                    },
                    "data": {
                        "values": exoplanetsMethodsData
                    },
                    "mark": {
                        "type": "bar",
                        "color": {
                            "x1": 1, "y1": 1, "x2": 0, "y2": 1,
                            "gradient": "linear",
                            "stops": [
                                {"offset": 0, "color": "#50E3C2"},
                                {"offset": 1, "color": "#50E3C2"}
                            ]
                        },
                        "cornerRadius": 4
                    },
                    "encoding": {
                        "x": {
                            "field": "method",
                            "type": "nominal",
                            "axis": {
                                "title": "Discovery Method",
                                "labelAngle": -45
                            },
                            "sort": "-y"
                        },
                        "y": {
                            "field": "count",
                            "type": "quantitative",
                            "axis": {
                                "title": "Number of Exoplanets"
                            }
                        },
                        "tooltip": [
                            {"field": "method", "type": "nominal", "title": "Method"},
                            {"field": "count", "type": "quantitative", "title": "Count"}
                        ]
                    }
                };

                vegaEmbed('#exoplanets-discovery-methods', exoplanetsMethodsSpec, {
                    actions: false,
                    renderer: 'svg'
                }).then(result => {
                    console.log('Methods chart rendered successfully');
                }).catch(error => {
                    console.error('Error rendering methods:', error);
                    container.innerHTML = '<div class="exoplanets-error">Error loading methods visualization</div>';
                });

            } catch (error) {
                console.error('Error in methods rendering:', error);
                container.innerHTML = '<div class="exoplanets-error">Error loading methods visualization</div>';
            }
        }, 100);
    }

    renderExoplanetsExplorer() {
        const container = document.getElementById('exoplanets-interactive-explorer');
        container.innerHTML = '<div class="exoplanets-loading">Initializing planet explorer...</div>';

        setTimeout(() => {
            try {
                const sampleSize = Math.min(800, this.exoplanetsData.length);
                const exoplanetsExplorerData = this.exoplanetsData
                    .filter(d => d.pl_rade && d.pl_eqt && d.pl_rade > 0 && d.pl_eqt > 0)
                    .slice(0, sampleSize);

                console.log('Explorer data:', exoplanetsExplorerData.length, 'planets');

                const exoplanetsExplorerSpec = {
                    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
                    "width": "container",
                    "height": 500,
                    "background": "transparent",
                    "title": {
                        "text": "Exoplanet Characteristics Explorer",
                        "color": "#ffffff",
                        "fontSize": 18,
                        "anchor": "start"
                    },
                    "config": {
                        "axis": {
                            "labelColor": "#ffffff",
                            "titleColor": "#ffffff",
                            "gridColor": "rgba(255,255,255,0.1)",
                            "tickColor": "#ffffff"
                        },
                        "view": {
                            "stroke": "transparent"
                        },
                        "title": {
                            "color": "#ffffff"
                        }
                    },
                    "data": {
                        "values": exoplanetsExplorerData
                    },
                    "params": [
                        {
                            "name": "exoplanets_method_select",
                            "select": {"type": "point", "fields": ["discoverymethod"]},
                            "bind": {
                                "input": "select",
                                "options": [null, ...Array.from(new Set(exoplanetsExplorerData.map(d => d.discoverymethod)))],
                                "labels": ["All Methods", ...Array.from(new Set(exoplanetsExplorerData.map(d => d.discoverymethod)))],
                                "name": "Filter by Discovery Method: "
                            }
                        }
                    ],
                    "transform": [
                        {"filter": {"param": "exoplanets_method_select"}}
                    ],
                    "mark": {
                        "type": "point",
                        "tooltip": {"content": "data"},
                        "opacity": 0.8,
                        "size": 100
                    },
                    "encoding": {
                        "x": {
                            "field": "pl_rade",
                            "type": "quantitative",
                            "axis": {"title": "Planet Radius (Earth Radii)"},
                            "scale": {"domain": [0.1, 10], "type": "log"}
                        },
                        "y": {
                            "field": "pl_eqt",
                            "type": "quantitative",
                            "axis": {"title": "Equilibrium Temperature (K)"},
                            "scale": {"domain": [100, 3000]}
                        },
                        "color": {
                            "field": "discoverymethod",
                            "type": "nominal",
                            "legend": {
                                "title": "Discovery Method",
                                "labelColor": "#ffffff",
                                "titleColor": "#ffffff"
                            },
                            "scale": {
                                "scheme": "viridis"
                            }
                        },
                        "tooltip": [
                            {"field": "pl_name", "type": "nominal", "title": "Planet Name"},
                            {"field": "discoverymethod", "type": "nominal", "title": "Method"},
                            {"field": "pl_rade", "type": "quantitative", "title": "Radius (Earth Radii)", "format": ".2f"},
                            {"field": "pl_eqt", "type": "quantitative", "title": "Temperature (K)"},
                            {"field": "discyear", "type": "quantitative", "title": "Discovery Year"}
                        ]
                    }
                };

                vegaEmbed('#exoplanets-interactive-explorer', exoplanetsExplorerSpec, {
                    actions: false,
                    renderer: 'svg'
                }).then(result => {
                    console.log('Explorer rendered successfully');
                    //force resize after rendering
                    setTimeout(() => {
                        window.dispatchEvent(new Event('resize'));
                    }, 500);
                }).catch(error => {
                    console.error('Error rendering explorer:', error);
                    container.innerHTML = '<div class="exoplanets-error">Error loading interactive explorer</div>';
                });

            } catch (error) {
                console.error('Error in explorer rendering:', error);
                container.innerHTML = '<div class="exoplanets-error">Error loading interactive explorer</div>';
            }
        }, 100);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ExoplanetsViz();
    });
} else {
    new ExoplanetsViz();
}