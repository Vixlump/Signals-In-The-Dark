 document.addEventListener('DOMContentLoaded', function() {
            function initializeUFOTrends() {
                if (typeof vegaEmbed !== 'undefined') {
                    
                    const ufoTrendsConfig = {
                        spec: {
                            width: "card",
                            height: 500,
                            background: "transparent",
                            padding: { top: 30, right: 10, bottom: 10, left: -1 },


                            data: { url: "dataset/scrubbedline.csv" },


                            transform: [
                                    {
                                        calculate: "year(toDate(datum.datetime))",
                                        as: "year"
                                    },
                                    {
                                        filter: "datum.year != null && datum.country != null && datum.country != ''"
                                    },
                                    {
                                        filter: "datum.year >= 1956"
                                    },


                                    {
                                        aggregate: [{ op: "count", as: "sightings" }],
                                        groupby: ["year", "country"]
                                    },
                                    {
                                        window: [{ op: "rank", as: "rank" }],
                                        sort: [
                                        { field: "year" },
                                        { field: "sightings", order: "descending" }
                                        ],
                                        groupby: ["year"]
                                    },
                                    {
                                        filter: "datum.rank <= 5"
                                    }
                            ],


             
                            encoding: {
                                x: {
                                    field: "year",
                                    type: "quantitative",
                                    axis: {
                                        labelColor: "white",
                                        titleColor: "white",
                                        labelFontSize: 12,
                                        titleFontSize: 14,
                                        format: "d",
                                        gridColor: "#4A6FCC",
                                        gridOpacity: 0.7,
                                        tickColor: "white",
                                        labelAngle: 0,
                                        labelPadding: 10,
                                        titlePadding: 25,
                                        labelAngle: -45
                                    },
                                    title: "Year"
                                },
                                y: {
                                    field: "sightings",
                                    type: "quantitative",
                                    axis: {
                                        labelColor: "white",
                                        titleColor: "white",
                                        labelFontSize: 12,
                                        titleFontSize: 14,
                                        gridColor: "#4A6FCC",
                                        gridOpacity: 0.7,
                                        tickColor: "white",
                                        titlePadding: 15,
                                        labelPadding: 8
                                    },
                                    title: "Number of Sightings"
                                },
                                color: {
                                    field: "country",
                                    type: "nominal",
                                    title: "Country",
                                    scale: {
                                        range: [
                                            "#FFFFFF",  // White
                                            "#F9FF3B",  // Yellow
                                            "#7B2FFF",  // Purple
                                            "#3B6FCC",  // Blue
                                            "#00E1FF",  // Cyan
                                            "#00FF8F"   // Green
                                        ]
                                    },
                                    legend: {
                                        labelColor: "white",
                                        titleColor: "white",
                                        labelFontSize: 13,
                                        titleFontSize: 16,
                                        labelFontWeight: "bold",
                                        titleFontWeight: "bold",
                                        labelExpr: `
                                            datum.label === 'us' ? 'United States' :
                                            datum.label === 'ca' ? 'Canada' :
                                            datum.label === 'au' ? 'Australia' :
                                            datum.label === 'gb' ? 'United Kingdom' :
                                            datum.label === 'de' ? 'Germany' :
                                            datum.label === 'fr' ? 'France' :
                                            datum.label === 'br' ? 'Brazil' :
                                            datum.label === 'mx' ? 'Mexico' :
                                            datum.label === 'es' ? 'Spain' :
                                            datum.label === 'it' ? 'Italy' :
                                            datum.label === 'undefined' ? 'Unknown' :
                                            datum.label
                                        `,
                                        orient: "bottom",
                                        direction: "horizontal",
                                        titleLimit: 0,
                                        columns: 5,
                                        rowPadding: 15,
                                        columnPadding: 30,
                                        symbolSize: 200,
                                        symbolStrokeWidth: 2,
                                        labelOffset: 10,
                                        title: "Country"
                                    }
                                },
                                tooltip: [
                                    { field: "year", type: "quantitative", title: "Year" },
                                    { field: "country", type: "nominal", title: "Country" },
                                    { field: "sightings", type: "quantitative", title: "Sightings", format: ".0f" }
                                ]
                            },


                            layer: [
                                { mark: { type: "line", strokeWidth: 3 } },

                                
                                {
                                    mark: {
                                        type: "point",
                                        size: 80,
                                        stroke: "white",
                                        strokeWidth: 1
                                    }
                                },

                                {
                                    data: {
                                        values: [
                                            { year: 1997, y: 300, event: "US: Phoenix Lights (1997)" },
                                            { year: 1967, y: 250, event: "US: Shag Harbour (1967)" },
                                            { year: 1980, y: 270, event: "US: Rendlesham Forest (1980)" }
                                        ]
                                    },
                                    mark: {
                                        type: "text",
                                        dx: 10,
                                        dy: -10,
                                        fontSize: 13,
                                        fontWeight: "bold",
                                        color: "#FFFFFF",
                                        opacity: 0.9
                                    },
                                    encoding: {
                                        x: { field: "year", type: "quantitative" },
                                        y: { field: "y", type: "quantitative" },
                                        text: { field: "event" }
                                    }
                                }
                            ],
                           
                            selection: {
                                country_select: {
                                    type: "multi",
                                    fields: ["country"],
                                    bind: "legend"
                                }
                            },
                           
                           
                        },
                       
                        // Custom embed options
                        options: {
                            actions: {
                                export: true,
                                source: false,
                                compiled: false,
                                editor: false
                            },
                            theme: "dark",
                            renderer: "canvas",
                            tooltip: {
                                theme: "dark"
                            }
                        }
                    };


                    
                    
                    
                    
                    
                    vegaEmbed("#ufo-trends-view", ufoTrendsConfig.spec, ufoTrendsConfig.options)
                        .then(result => {
                            console.log("UFO Trends visualization loaded successfully");
                           
                            window.ufoTrendsView = result.view;
                           
                            function ensureFullVisibility() {
                                const container = document.querySelector('.ufo-trends-view-wrapper');
                                const viewElement = document.getElementById('ufo-trends-view');
                               
                                if (container && viewElement && window.ufoTrendsView) {
                                   
                                    const availableWidth = container.clientWidth - 60;
                                    const targetWidth = Math.max(50, Math.min(availableWidth, 1200));
                                   
                                   
                                    window.ufoTrendsView.width(targetWidth).runAsync();
                                   
                                    setTimeout(() => {
                                        const legendLabels = viewElement.querySelectorAll('.vega-legend-label');
                                        legendLabels.forEach(label => {
                                            label.style.fill = 'white';
                                            label.style.color = 'white';
                                            label.style.fontSize = '13px';
                                            label.style.fontWeight = 'bold';
                                            label.style.opacity = '1';
                                        });
                                       
                                        const legendTitle = viewElement.querySelector('.vega-legend-title');
                                        if (legendTitle) {
                                            legendTitle.style.fill = 'white';
                                            legendTitle.style.color = 'white';
                                            legendTitle.style.fontSize = '15px';
                                            legendTitle.style.fontWeight = 'bold';
                                            legendTitle.style.opacity = '1';
                                        }
                                       
                                        const svg = viewElement.querySelector('svg');
                                        if (svg) {
                                            svg.style.overflow = 'visible';
                                            svg.style.maxWidth = '100%';
                                            svg.style.height = 'auto';
                                        }
                                    }, 500);
                                   
                                    if (targetWidth < 1000) {
                                        const existingHint = document.querySelector('.scroll-hint');
                                        if (!existingHint) {
                                            const scrollHint = document.createElement('div');
                                            scrollHint.className = 'scroll-hint';
                                            scrollHint.style.cssText = `
                                                color: #00E1FF;
                                                text-align: center;
                                                font-size: 14px;
                                                margin-top: 15px;
                                                padding: 8px;
                                                font-style: italic;
                                                opacity: 0.8;
                                                background: rgba(10, 18, 37, 0.7);
                                                border-radius: 5px;
                                            `;
                                            //scrollHint.textContent = '← Scroll horizontally to see full chart →';
                                            viewElement.parentNode.appendChild(scrollHint);
                                        }
                                    }
                                }
                            }
                           
                            setTimeout(ensureFullVisibility, 100);
                           
                            window.addEventListener('resize', ensureFullVisibility);
                           
                            setTimeout(() => {
                                if (window.ufoTrendsView) {
                                    window.ufoTrendsView.runAsync();
                                    ensureFullVisibility();
                                }
                            }, 1000);
                           
                            setTimeout(ensureFullVisibility, 2000);
                        })
                        .catch(error => {
                            console.error("Error embedding UFO Trends visualization:", error);
                            document.getElementById('ufo-trends-view').innerHTML =
                                '<div style="color: white; text-align: center; padding: 50px; font-family: Arial, sans-serif; background: rgba(10, 18, 37, 0.9); border-radius: 10px; border: 2px solid #4A6FCC;">' +
                                '<h3 style="color: #00E1FF;">Visualization Loading Error</h3>' +
                                '<p>Unable to load the UFO sightings chart. Please check that:</p>' +
                                '<ul style="text-align: left; display: inline-block; margin: 20px auto;">' +
                                '<li>The data file exists at "dataset/scrubbedline.csv"</li>' +
                                '<li>Your internet connection is working</li>' +
                                '<li>JavaScript is enabled in your browser</li>' +
                                '</ul>' +
                                '<p style="color: #F9FF3B;">Error details: ' + error.message + '</p>' +
                                '</div>';
                        });
                } else {
                    setTimeout(initializeUFOTrends, 100);
                }
            }
           
            setTimeout(initializeUFOTrends, 500);
        });
