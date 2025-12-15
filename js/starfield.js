// function createStarfield() {
//     const svg = d3.select("#starfield")
//         .append("svg")
//         .attr("width", "100%")
//         .attr("height", "100%");
    
//     const width = window.innerWidth;
//     const height = window.innerHeight;
    
//     const stars = [];
//     const starCount = 400;
    
//     for (let i = 0; i < starCount; i++) {
//         stars.push({
//             x: Math.random() * width,
//             y: Math.random() * height,
//             size: Math.random() * 4 + 0.5,
//             color: getRandomStarColor(),
//             opacity: Math.random() * 0.8 + 0.2,
//             speed: Math.random() * 2 + 0.5,
//             angle: Math.random() * Math.PI * 2,
//             orbitRadius: Math.random() * 100 + 20,
//             rotationSpeed: (Math.random() - 0.5) * 0.05,
//             pulseSpeed: Math.random() * 0.05 + 0.02,
//             baseSize: 0
//         });
//     }
    
//     //set base sizes after creation
//     stars.forEach(star => {
//         star.baseSize = star.size;
//     });
    
//     //draw stars
//     const starElements = svg.selectAll("circle")
//         .data(stars)
//         .enter()
//         .append("circle")
//         .attr("cx", d => d.x)
//         .attr("cy", d => d.y)
//         .attr("r", d => d.size)
//         .attr("fill", d => d.color)
//         .attr("opacity", d => d.opacity);
    
//     //mouse position tracking
//     let mouseX = width / 2;
//     let mouseY = height / 2;
//     let mouseMoved = false;
    
//     //auto-movement variables
//     let autoAngle = 0;
//     let autoRadius = 200;
//     let autoX = width / 2;
//     let autoY = height / 2;
    
//     //update mouse position
//     document.addEventListener("mousemove", (e) => {
//         mouseX = e.clientX;
//         mouseY = e.clientY;
//         mouseMoved = true;
        
//         //reset auto movement when user moves mouse
//         autoX = mouseX;
//         autoY = mouseY;
//         autoAngle = 0;
//     });
    
//     //automovement when mouse is still
//     function updateAutoMovement() {
//         if (!mouseMoved) {
//             autoAngle += 0.02;
//             autoX = width / 2 + Math.cos(autoAngle) * autoRadius;
//             autoY = height / 2 + Math.sin(autoAngle) * autoRadius;
//         }
//     }
    
//     //animation loop
//     function animate() {
//         updateAutoMovement();
        
//         const currentMouseX = mouseMoved ? mouseX : autoX;
//         const currentMouseY = mouseMoved ? mouseY : autoY;
        
//         starElements
//             .each(function(d) {
//                 //calculate distance from mouse
//                 const dx = d.x - currentMouseX;
//                 const dy = d.y - currentMouseY;
//                 const distance = Math.sqrt(dx * dx + dy * dy);
                
//                 //spiral effect based on distance and angle
//                 if (distance < 400) { // Effect radius
//                     const force = 1 - (distance / 400);
//                     const spiralForce = force * 2;
                    
//                     //update angle for spiral rotation
//                     d.angle += d.rotationSpeed + spiralForce * 0.1;
                    
//                     //calculate spiral offset
//                     const spiralX = Math.cos(d.angle) * d.orbitRadius * force;
//                     const spiralY = Math.sin(d.angle) * d.orbitRadius * force;
                    
//                     //store original positions if not already stored
//                     if (d.originalX === undefined) {
//                         d.originalX = d.x;
//                         d.originalY = d.y;
//                     }
                    
//                     //apply spiral movement with easing
//                     d.targetX = d.originalX + spiralX;
//                     d.targetY = d.originalY + spiralY;
                    
//                     //smooth movement toward target
//                     d.x += (d.targetX - d.x) * 0.1;
//                     d.y += (d.targetY - d.y) * 0.1;
                    
//                     //pulsing size effect
//                     d.size = d.baseSize * (1 + Math.sin(Date.now() * d.pulseSpeed) * 0.3);
                    
//                     //color intensity based on proximity to mouse
//                     const intensity = 1 + force * 0.5;
//                     d3.select(this)
//                         .attr("fill", increaseColorIntensity(d.color, intensity));
//                 } else {
//                     //return to original position when far from mouse
//                     if (d.originalX === undefined) {
//                         d.originalX = d.x;
//                         d.originalY = d.y;
//                     }
                    
//                     const returnSpeed = 0.05;
//                     d.x += (d.originalX - d.x) * returnSpeed;
//                     d.y += (d.originalY - d.y) * returnSpeed;
//                     d.size = d.baseSize;
                    
//                     d3.select(this)
//                         .attr("fill", d.color);
//                 }
//             })
//             .attr("cx", d => d.x)
//             .attr("cy", d => d.y)
//             .attr("r", d => d.size);
        
//         requestAnimationFrame(animate);
//     }
    
//     //store original positions
//     starElements.each(function(d, i) {
//         d.originalX = d.x;
//         d.originalY = d.y;
//     });
    
//     //parallax effect on scroll
//     window.addEventListener("scroll", () => {
//         const scrollY = window.scrollY;
        
//         starElements
//             .transition()
//             .duration(100)
//             .attr("transform", function(d) {
//                 const moveY = -scrollY * d.speed * 0.03;
//                 return `translate(0, ${moveY})`;
//             });
//     });
    
//     //resize handler
//     window.addEventListener("resize", () => {
//         svg.remove();
//         createStarfield();
//     });
    
//     //start animation
//     animate();
    
//     //reset mouse moved flag after 2 seconds of inactivity
//     setInterval(() => {
//         mouseMoved = false;
//     }, 2000);
// }

// //generate random star colors
// function getRandomStarColor() {
//     const colors = [
//         '#ffffff', //White
//         '#6a9eff', //Blue
//         '#4a7eff', //Deep Blue
//         // '#ff6a9e', //Pink
//         // '#ffb46a', //Orange
//         // '#9eff6a', //Green
//         // '#6affb4', //Teal
//         // '#b46aff', //Purple
//         // '#ff4a4a', //Red
//         // '#ffff6a'  //Yellow
//     ];
//     return colors[Math.floor(Math.random() * colors.length)];
// }

// //increase color intensity
// function increaseColorIntensity(color, intensity) {
//     let r, g, b;
//     if (color.startsWith('#')) {
//         r = parseInt(color.slice(1, 3), 16);
//         g = parseInt(color.slice(3, 5), 16);
//         b = parseInt(color.slice(5, 7), 16);
//     } else {
//         //Handle named colors
//         return color;
//     }
    
//     //Increase intensity
//     r = Math.min(255, Math.floor(r * intensity));
//     g = Math.min(255, Math.floor(g * intensity));
//     b = Math.min(255, Math.floor(b * intensity));
    
//     //Convert back to hex
//     return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
// }

// document.addEventListener('DOMContentLoaded', createStarfield);