
let width = window.innerWidth;
let height = window.innerHeight;

window.addEventListener("resize", function() {
    width = window.innerWidth;
    height = window.innerHeight;
});



value = (x, y) =>
  (1 + (x + y + 1) ** 2 * (19 - 14 * x + 3 * x ** 2 - 14 * y + 6 * x * y + 3 * y ** 2))
  * (30 + (2 * x - 3 * y) ** 2 * (18 - 32 * x + 12 * x * x + 48 * y - 36 * x * y + 27 * y ** 2))

const svg = d3.create("svg")
  .attr("viewBox", [0, 0, 6, 6])
  .style("display", "block")

const g = svg.append("g");
var path = d3.geoPath()

contours = d3.contours()
    .size([ 6, 6 ])
    ([
        0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0,
        0, 0, 1, 0, 0, 0,
        0, 0, 0, 2, 0, 0,
        0, 0, 0, 0, 1, 0,
        0, 0, 0, 0, 0, 0
    ])

svg.append("g")
  .attr("fill", "none")
  .attr("stroke", "#000")
  .attr("stroke-opacity", 0.5)
.selectAll("path")
.data(contours)
.join("path")
  .attr("fill", "#fff")
  .attr("d", d3.geoPath());


window.onload = function() {
    document.querySelector(".main-thing").appendChild(svg.node())
}