// This is your playground!
// Add functionality to your html controls, play with cytoscape's events and make those magic lenses!

/* global fetch, cytoscape */
import _style from "/style.js";

var data1 = [
  {group: "A", value: 4},
  {group: "B", value: 16},
  {group: "C", value: 8}
];

var data2 = [
  {group: "A", value: 7},
  {group: "B", value: 1},
  {group: "C", value: 20}
];

// set the dimensions and margins of the graph
var margin = {top: 30, right: 30, bottom: 70, left: 60},
   width = 460 - margin.left - margin.right,
   height = 400 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#my_dataviz")
 .append("svg")
   .attr("width", width + margin.left + margin.right)
   .attr("height", height + margin.top + margin.bottom)
 .append("g")
   .attr("transform",
         "translate(" + margin.left + "," + margin.top + ")");

// X axis
var x = d3.scaleBand()
 .range([ 0, width ])
 .domain(data1.map(function(d) { return d.group; }))
 .padding(0.2);
svg.append("g")
 .attr("transform", "translate(0," + height + ")")
 .call(d3.axisBottom(x))

// Add Y axis
var y = d3.scaleLinear()
 .domain([0, 20])
 .range([ height, 0]);
svg.append("g")
 .attr("class", "myYaxis")
 .call(d3.axisLeft(y));

// A function that create / update the plot for a given variable:
function update(data) {
 var u = svg.selectAll("rect")
   .data(data)

 u
   .enter()
   .append("rect")
   .merge(u)
   .transition()
   .duration(1000)
     .attr("x", function(d) { return x(d.group); })
     .attr("y", function(d) { return y(d.value); })
     .attr("width", x.bandwidth())
     .attr("height", function(d) { return height - y(d.value); })
     .attr("fill", "#69b3a2")
}
// Initialize the plot with the first dataset
update(data1)

function getImage() {
  var chartContainer = d3.select("#my_dataviz");
  var svgElement = chartContainer.select("svg").node();

  var svgString = new XMLSerializer().serializeToString(svgElement);

 return "data:image/svg+xml;base64," + btoa(svgString);
}

// returns true if the point "p" is inside the circle defined by "c" (center) and "r" (radius)
function isInCircle(c, r, p) {
  return Math.pow(p.x - c.x, 2) + Math.pow(p.y - c.y, 2) <= Math.pow(r, 2);
}
const rangeSelector = document.getElementById("rangeSelector");
const lens = document.getElementById("lens");
let radius = 40;
let radiusMultiplier = 0;
let changeNodeShape = true;
let highlightEdge = false;
let lenseBehavoirSelect = document.getElementById("lenseBehavoirSelect");

lenseBehavoirSelect.addEventListener("change", (e) => {
  let selectedValue = Number(e.target.value);
  if (selectedValue === 1) {
    changeNodeShape = true;
    highlightEdge = false;
  } else if (selectedValue === 2) {
    changeNodeShape = false;
    highlightEdge = true;
  }
});
if (rangeSelector) {
  rangeSelector.addEventListener("change", (e) => {
    radiusMultiplier = e.target.value;
    radius = 40 + 40 * radiusMultiplier;
    lens.setAttribute("r", radius);
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "+") {
    radiusMultiplier += 0.2;
    radius = 40 + 40 * radiusMultiplier;
    lens.setAttribute("r", radius);
  } else if (event.key === "-") {
    radiusMultiplier -= 0.2;
    radius = 40 + 40 * radiusMultiplier;
    if (radius >= 40) {
      lens.setAttribute("r", radius);
    }
  }
});
fetch("data/data.json")
  .then((res) => res.json())
  .then((data) => {
    const cy = cytoscape({
      container: document.getElementById("cy"),
      style: _style,
      elements: data,
      layout: {
        name: "cola",
        nodeSpacing: 5,
        edgeLength: 200,
        animate: true,
        randomize: false,
        maxSimulationTime: 1500,
      },
    });

    cy.on("mousemove", function (e) {
      /* 

      Your code goes here! 

      HINTs: 
        1. use the "isInCircle" function defined above to calculate whether a node is inside the lens! 
        2. if you experience performance issues, use cy.startBatch() and cy.endBatch() to avoid unnecessary canvas redraws. See https://js.cytoscape.org/#cy.batch for more
        3. see below how to get the mouse and node positions
      */

      const mouse = { x: e.originalEvent.x, y: e.originalEvent.y };
      // console.log(`Mouse position: [x: ${mouse.x}, y: ${mouse.y}]`);
      if (lens) {
        lens.setAttribute("cx", mouse.x);
        lens.setAttribute("cy", mouse.y);
      }
      cy.nodes().forEach((n) => {
        cy.startBatch();
        const node = n.renderedPosition(); // Careful: other position functions may invoke different coordinate systems
        let graphNode = cy.$(`#${n.id()}`);
        if (isInCircle(mouse, radius, node)) {
          console.log(changeNodeShape);
          if (graphNode) {
            if (changeNodeShape) {
              graphNode.addClass("magic");
              graphNode.style({
                 'background-image': "url(" + getImage() + ") no-repeat center",
                 'background-width': '100%', // Adjust the width and height according to your needs
                 'background-height': '100%'
              });
            }
            if (highlightEdge) {
              let edges = graphNode.connectedEdges();
              edges.style('line-color', '#00A3FF');
              edges.forEach((e) => {
                let edge = cy.$(`#${e.id()}`);
                if (!!edge) {
                  edge.addClass("magic");
                }
              });
            }
          }
        } else {
          if (changeNodeShape) {
            graphNode.removeClass("magic");
            graphNode.removeStyle('background-image');
          }
          if (highlightEdge) {
            let edges = graphNode.connectedEdges();
            edges.removeStyle('line-color');
            edges.forEach((e) => {
              let edge = cy.$(`#${e.id()}`);
              if (!!edge) {
                edge.removeClass("magic");
              } else {
                edge.addClass("highlight");
              }
            });
          }
        }
        cy.endBatch();
        // console.log(`Node position: [x: ${node.x}, y: ${node.y}]`);
      });
    });
  });
