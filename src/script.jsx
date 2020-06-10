
import 'core-js/features/promise';
import 'core-js/features/array/from';
import 'core-js/features/symbol';
import 'unfetch/polyfill/index.js';
import 'svg-classlist-polyfill';

import './geometry-polyfill.js';
import regeneratorRuntime from 'regenerator-runtime';
import { default as OrigSwal } from 'sweetalert2';
import raf from "raf";


import Panzoom from '@panzoom/panzoom'
import {Howl, Howler} from 'howler';

let currentPoints = 0;

const POINT_FAIL_THRESHOLD = -15;

const FAKE_TEMPERATURE_SHIFT = 20;

var reportFinished = false;

var ie11FakeRect;

(function (arr) {
    arr.forEach(function (item) {
      if (item.hasOwnProperty('remove')) {
        return;
      }
      Object.defineProperty(item, 'remove', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: function remove() {
          if (this.parentNode === null) {
            return;
          }
          this.parentNode.removeChild(this);
        }
      });
    });
})([Element.prototype, CharacterData.prototype, DocumentType.prototype]);

var correctSound = new Howl({
    src: ['weather/correct.mp3']
});

var popSound = new Howl({
    src: ['weather/pop.mp3']
});

const Swal = OrigSwal.mixin({
    onOpen: () => {
        popSound.play()
    }
});

(function() {
    if (typeof window.CustomEvent === "function") return false
  
    function CustomEvent(event, params) {
      params = params || { bubbles: false, cancelable: false, detail: undefined }
      var evt = document.createEvent("CustomEvent")
      evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail)
      return evt
    }
  
    CustomEvent.prototype = window.Event.prototype
  
    window.CustomEvent = CustomEvent
})();

var reports;
var availableReports = [
    [
        { city: "Rochester", type: "warm-front", rotation: 230, description: "There is a warm front southwest of Rochester.", targetPoint: [ -40, 20 ] },
        { city: "Rochester", type: "rain", description: "The warm front has caused showers in Rochester.", targetPoint: [ -10, 0 ] },
        { city: "Rochester", type: "temperature", degrees: 35, description: "It's 35 degrees Fahrenheit in Rochester.", targetPoint: [ 10, 30 ] },
        { city: "Duluth", type: "high-pressure", description: "A high pressure system is passing over Duluth this afternoon.", targetPoint: [ -20, -20 ] },
        { city: "Duluth", type: "partly-cloudy", description: "The sky is partly cloudy over Duluth.", targetPoint: [ -20, 0 ] },
        { city: "Duluth", type: "temperature", degrees: 12, description: "It's 12 degrees Fahrenheit in Duluth.", targetPoint: [ 10, 10 ] },
        { city: "Minneapolis", type: "snow", description: "It's snowing in Minneapolis.", targetPoint: [ -20, -20 ] },
        { city: "Minneapolis", type: "partly-cloudy", description: "The sky is partly cloudy over Minneapolis.", targetPoint: [ -30, 0 ] },
        { city: "Minneapolis", type: "temperature", degrees: 13, description: "It's 13 degrees Fahrenheit in Minneapolis.", targetPoint: [ -20, 5 ] },
    ],
    [
        { city: "Los Angeles", type: "high-pressure", description: "A high pressure system is hovering between San Francisco and Los Angeles.", targetPoint: [ -30, -40 ]},
        { city: "San Francisco", type: "sunny", description: "It's clear and sunny in San Francisco.", targetPoint: [ 20, 20 ] },
        { city: "Los Angeles", type: "cold-front", rotation: 60, description: "A cold front is moving southwest towards Los Angeles", targetPoint: [ 40, -40 ] },
        { city: "Los Angeles", type: "temperature", degrees: 45, description: "The temperature is around 45 degrees in Los Angeles.", targetPoint: [ -60, 0 ]},
        { city: "San Francisco", type: "temperature", degrees: 42, description: "The temperature is around 42 degrees in San Francisco.", targetPoint: [ -60, 0 ]},
        { city: "Sacramento", type: "warm-front", description: "There is a warm front over Sacramento causing thunderstorms", targetPoint: [ -60, -20 ]},
        { city: "Sacramento", type: "thunderstorm", description: "There is a warm front over Sacramento causing thunderstorms", targetPoint: [ 20, -10 ]},
        { city: "Sacramento", type: "temperature", degrees: 42, description: "The temperature is around 42 degrees in Sacramento.", targetPoint: [ -60, 10 ]},
    ],
    [
        { city: "Austin", type: "partly-cloudy", description: "Weather in Austin is partly cloudy with a chance of rain. There is a cold front further north that will pass through in a few hours.", targetPoint: [ -10, -10 ]},
        { city: "Austin", type: "rain", description: "Weather in Austin is partly cloudy with a chance of rain. There is a cold front further north that will pass through in a few hours.", targetPoint: [ 10, -10 ]},
        { city: "Austin", type: "cold-front", rotation: 30, description: "Weather in Austin is partly cloudy with a chance of rain. There is a cold front further north that will pass through in a few hours.", targetPoint: [ 0, -40 ]},
        { city: "Austin", type: "temperature", degrees: 80, description: "Temperatures in Austin are around 80 degrees Fahrenheit.", targetPoint: [ -10, 10 ]},
        { city: "Houston", type: "low-pressure", description: "There is a low pressure system over Houston and Corpus Christi. This has caused partly cloudy conditions in Houston and rain in Corpus Christi.", targetPoint: [ 10, 10 ]},
        { city: "Houston", type: "partly-cloudy", description: "There is a low pressure system over Houston and Corpus Christi. This has caused partly cloudy conditions in Houston and rain in Corpus Christi.", targetPoint: [ -20, 0 ]},
        { city: "Corpus Christi", type: "rain", description: "There is a low pressure system over Houston and Corpus Christi. This has caused partly cloudy conditions in Houston and rain in Corpus Christi.", targetPoint: [ 0, 10 ]},
        { city: "Houston", type: "temperature", degrees: 70, description: "Temperatures in Houston are around 70 degrees Fahrenheit.", targetPoint: [ -10, 10 ]},
        { city: "Corpus Christi", type: "temperature", degrees: 75, description: "Temperatures in Corpus Christi are around 75 degrees Fahrenheit.", targetPoint: [ -30, 10 ]},
        { city: "San Francisco", type: "thunderstorm", description: "San Francisco will experience thunderstorms as a result of a low pressure system centered on Sacramento.", targetPoint: [ 0, 20 ]},
        { city: "Sacramento", type: "low-pressure", description: "San Francisco will experience thunderstorms as a result of a low pressure system centered on Sacramento.", targetPoint: [ 0, 0 ]},
        { city: "San Francisco", type: "temperature", degrees: 65, description: "Temperatures range from 65 degrees Fahrenheit in San Francisco to 76 degrees in Sacramento.", targetPoint: [ 30, 20 ]},
        { city: "Sacramento", type: "temperature", degrees: 76, description: "Temperatures range from 65 degrees Fahrenheit in San Francisco to 76 degrees in Sacramento.", targetPoint: [ 10, -20 ]},
    ]
];

//availableReports[1].unshift(...availableReports[0]);

if (!document.elementsFromPoint) {
    if(!document.msElementsFromPoint)
        document.elementsFromPoint = function(x, y) {
            var parents = [];
            var parent = void 0;
            do {
                if (parent !== document.elementFromPoint(x, y)) {
                    parent = document.elementFromPoint(x, y);
                    parents.push(parent);
                    parent.style.pointerEvents = 'none';
                } else {
                    parent = false;
                }
            } while (parent);
            parents.forEach(function (parent) {
                return parent.style.pointerEvents = 'all';
            });
            return parents;
        };
    else
        document.elementsFromPoint = function(x, y) {
            var nl = document.msElementsFromPoint(x, y);
            if(nl.length < 1)
                return [];
            return Array.from(nl);
        };
}

if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || 
                                Element.prototype.webkitMatchesSelector;
}
  
if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
      var el = this;
  
      do {
        if (Element.prototype.matches.call(el, s)) return el;
        el = el.parentElement || el.parentNode;
      } while (el !== null && el.nodeType === 1);
      return null;
    };
}

(function () {
	"use strict";

	if (!("parentElement" in Document.prototype) || !("parentElement" in Text.prototype) || !("parentElement" in Attr.prototype)) {
		// Environment doesn't support 'parentElement' or only supports it on nodes that are Elements themselves.
		// To unify behavior between all browsers and to be spec-compliant, parentElement should be supported on any Node.

		function implementation () {
			return this.parentNode instanceof Element ? this.parentNode : null;
		}

		try {
			Object.defineProperty(Attr.prototype, "parentElement", { configurable: false, enumerable: false, get: implementation });
		} catch (e) {
			// IE8
			Attr.prototype.parentElement = implementation;
		}

		try {
			Object.defineProperty(Text.prototype, "parentElement", { configurable: false, enumerable: false, get: implementation });
		} catch (e) {
			// IE8
			Text.prototype.parentElement = implementation;
		}

		try {
			Object.defineProperty(Element.prototype, "parentElement", { configurable: false, enumerable: false, get: implementation });
		} catch (e) {
			// IE8
			Element.prototype.parentElement = implementation;
		}

		try {
			Object.defineProperty(Document.prototype, "parentElement", { configurable: false, enumerable: false, get: implementation });
		} catch (e) {
			// IE8
			Document.prototype.parentElement = implementation;
		}

	}
}());

const CHUNK_WIDTH = 64;
const CHUNK_HEIGHT = 64;

let chunkRows = 0, chunkColumns = 0;

let chunkDataArray = [];

const EXTRA_MARGIN = 32;


async function showSymbolDoc() {
    return Swal.fire({
        html: '<table><tr><th class="min">Weather symbol</th><th>Description</th></tr>' +
            '<tr><td class="min"><img class="symbol" src="weather/low-pressure.svg"/></td><td><b>Low pressure system</b> - refers to a place where the atmospheric pressure is lowest compared to the surrounding area.</td></tr>' +
            '<tr><td class="min"><img class="symbol" src="weather/high-pressure.svg"/></td><td><b>High pressure system</b> - refers to a place where the atmospheric pressure is highest compared to the surrounding area.</td></tr>' +
            '<tr><td class="min"><img class="symbol" src="weather/warm-front.svg"/></td><td><b>Warm front</b> - depicts the edge of an area of warm air moving into a colder region.</td></tr>' +
            '<tr><td class="min"><img class="symbol" src="weather/cold-front.svg"/></td><td><b>Cold front</b> - depicts the edge of an area of cold air moving into a wamer region.</td></tr>' +
            '<tr><td class="min"><img class="symbol" src="weather/sunny.svg"/></td><td><b>Sunny</b> - no precipitation and no clouds.</td></tr>' +
            '<tr><td class="min"><img class="symbol" src="weather/partly-cloudy.svg"/></td><td><b>Partly cloudy</b> - some clouds, but no precipitation.</td></tr>' +
            '<tr><td class="min"><img class="symbol" src="weather/rain.svg"/></td><td><b>Rain</b></td></tr>' +
            '<tr><td class="min"><img class="symbol" src="weather/snow.svg"/></td><td><b>Snow</b></td></tr>' +
            '<tr><td class="min"><img class="symbol" src="weather/thunderstorm.svg"/></td><td><b>Thunderstorm</b></td></tr>' +
            '<tr><td class="min"><img class="symbol" src="weather/windbarb.svg"/></td><td><b>Wind barb</b> - each line represents 10 mph of the wind speed.</td></tr>' +
        '</table>'
    });
}

async function showReportDoc() {
    return Swal.fire({
        icon: 'info',
        title: 'Welcome to Weather Reporting!',
        html: 'Information about the current conditions will appear at the bottom of your screen. Drag items from the top left of your screen into the appropriate locations on the map.<p></p>' +
            'Some weather reports will list more than one icon. You should drag the icons onto the map in the order that they are listed.<p></p>' +
            'You can move around the map either by dragging (except for Internet Explorer) or by using your arrow keys. Finish the weather report before you run out of time!'
    });
}

async function showPredictDoc() {
    return Swal.fire({
        icon: 'info',
        title: 'Instructions',
        html: 'Welcome to Weather Predictions!<p></p>Weather information will periodically ' +
            'appear in areas on the map. You can move around the map either by dragging (except for Internet Explorer) or by using your arrow keys. When a lightbulb appears, click on it, and do your ' + 
            'best to answer the question with the information you have!<p></p> '+
            "You're trying to predict what the conditions will be within the next 30 seconds or so (of real time).<p></p>" +
            "If you don't see any weather information near you, assume that it is sunny, and the temperature is " +
            `around ${BASE_TEMPERATURE} degrees Fahrenheit.<p></p>` +
            "Also, remember that weather which isn't moving towards you is irrelevant. You can use the wind barbs to figure out what's moving towards you and the speed at which it's moving. Each line coming off the wind barb adds 10 mph to the speed.<p></p>" +
            `Your goal is to reach 100 points. If you fall below ${POINT_FAIL_THRESHOLD} points, ` +
            'you will lose the game.'
    });
}


function removeLoader() {
    var l = document.querySelector(".loader");
    l.style.opacity = 0;
    setTimeout(() => l.remove(), 1000);
}
let city, stateGroup, svg, mapGroup, panzoom, currentReport = -1, pivotPoint, fakeWeather, reactGroup, uiSvg;
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}
function getCityName(city) {
    return (city.textContent.replace("⍟", "").replace(" ", "")).trim();
}

function getElementOffsetFromSVG(el) {
    var bRect0 = svg.getBoundingClientRect();
    var bRect1 = el.getBoundingClientRect();
    return [bRect1.left - bRect0.left, bRect1.top - bRect0.top];
}
/**
 * @param {SVGElement} element - Element to get the bounding box for
 * @param {boolean} [withoutTransforms=false] - If true, transforms will not be calculated
 * @param {SVGElement} [toElement] - Element to calculate bounding box relative to
 * @returns {SVGRect} Coordinates and dimensions of the real bounding box
 */
function getBBox(element, withoutTransforms, toElement) {

    var svg = element.ownerSVGElement;
  
    if (!svg) {
      return { x: 0, y: 0, cx: 0, cy: 0, width: 0, height: 0 };
    }
  
    var r = element.getBBox(); 
  
    if (withoutTransforms) {
      return {
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height,        
            cx: r.x + r.width / 2,
            cy: r.y + r.height / 2
      };
    }
  
    var p = svg.createSVGPoint(); 
  
    var matrix = (toElement || svg).getScreenCTM().inverse().multiply(element.getScreenCTM()); 
  
    p.x = r.x;
    p.y = r.y;
    var a = p.matrixTransform(matrix);
  
    p.x = r.x + r.width;
    p.y = r.y;
    var b = p.matrixTransform(matrix);
  
    p.x = r.x + r.width;
    p.y = r.y + r.height;
    var c = p.matrixTransform(matrix);
  
    p.x = r.x;
    p.y = r.y + r.height;
    var d = p.matrixTransform(matrix);
  
    var minX = Math.min(a.x, b.x, c.x, d.x);
    var maxX = Math.max(a.x, b.x, c.x, d.x);
    var minY = Math.min(a.y, b.y, c.y, d.y);
    var maxY = Math.max(a.y, b.y, c.y, d.y);
  
    var width = maxX - minX;
    var height = maxY - minY;
  
    return {
        x: minX,
        y: minY,
        width: width,
        height: height,        
        cx: minX + width / 2,
        cy: minY + height / 2
    };
}
var cities,clickArea,numDragTries,numObjectPlaces;
function makeDraggable(evt) {
    var svg = evt.target || evt;

    svg.addEventListener('mousedown', startDrag);
    svg.addEventListener('mousemove', drag);
    svg.addEventListener('mouseup', endDrag);
    svg.addEventListener('mouseleave', endDrag);
    svg.addEventListener('touchstart', startDrag);
    svg.addEventListener('touchmove', drag);
    svg.addEventListener('touchend', endDrag);
    svg.addEventListener('touchleave', endDrag);
    svg.addEventListener('touchcancel', endDrag);

    var selectedElement, offset, currentDroppable,
        bbox, minX, maxX, minY, maxY, confined, lastDX, lastDY;
    
    /** @type {SVGTransform} */
    var transform;

    var boundaryX1 = 10.5;
    var boundaryX2 = 30;
    var boundaryY1 = 2.2;
    var boundaryY2 = 19.2;

    function getMousePosition(evt) {
        var CTM = svg.getScreenCTM();
        if (evt.touches) { evt = evt.touches[0]; }
        return {
            x: (evt.clientX - CTM.e) / CTM.a,
            y: (evt.clientY - CTM.f) / CTM.d
        };
    }

    function startDrag(evt) {
        var target = evt.target.closest(".draggable");
        console.log("drag start event");
        if (target) {
            console.log("start drag");
            const tBBox = getBBox(target, false);
            console.log(tBBox);
            selectedElement = target.cloneNode(true);
            /* ui container offsets */
            selectedElement.setAttribute("data-xoffset", tBBox.x); // - 44.14);
            selectedElement.setAttribute("data-yoffset", tBBox.y); //- 25.2);
            target.parentNode.appendChild(selectedElement);

            offset = getMousePosition(evt);

            // Make sure the first transform on the element is a translate transform
            var transforms = selectedElement.transform.baseVal;

            if (transforms.numberOfItems == 0 || transforms.length === 0 || transforms.getItem(0).type !== SVGTransform.SVG_TRANSFORM_TRANSLATE) {
                // Create an transform that translates by (0, 0)
                var translate = svg.createSVGTransform();
                translate.setTranslate(0, 0);
                selectedElement.transform.baseVal.insertItemBefore(translate, 0);
            }

            // Get initial translation
            transform = transforms.getItem(0);
            offset.x -= transform.matrix.e;
            offset.y -= transform.matrix.f;

            confined = selectedElement.classList.contains('confine');
            if (confined) {
                bbox = selectedElement.getBBox();
                minX = boundaryX1 - bbox.x;
                maxX = boundaryX2 - bbox.x - bbox.width;
                minY = boundaryY1 - bbox.y;
                maxY = boundaryY2 - bbox.y - bbox.height;
            }
        }
    }
    function enterDroppable(currentDroppable) {

    }
    function leaveDroppable(currentDroppable) {

    }
    function drag(evt) {
        if (selectedElement) {
            evt.preventDefault();

            var coord = getMousePosition(evt);
            var dx = coord.x - offset.x;
            var dy = coord.y - offset.y;

            if (confined) {
                if (dx < minX) { dx = minX; }
                else if (dx > maxX) { dx = maxX; }
                if (dy < minY) { dy = minY; }
                else if (dy > maxY) { dy = maxY; }
            }

            lastDX = dx;
            lastDY = dy;

            transform.setTranslate(dx, dy);
            //removeItem(0);
            //selectedElement.transform.insertItemBefore(transform, 0);
            //selectedElement.setAttribute("transform", DOMMatrix.fromMatrix(transform.matrix).toString());
            selectedElement.style.display = 'none';
            var cevt = evt;
            if (cevt.touches) { cevt = cevt.touches[0]; }
            let elemBelow = document.elementsFromPoint(cevt.clientX, cevt.clientY);
            selectedElement.style.display = "";

            // mousemove events may trigger out of the window (when the ball is dragged off-screen)
            // if clientX/clientY are out of the window, then elementFromPoint returns null
            if (!elemBelow) return;

            // potential droppables are labeled with the class "droppable" (can be other logic)
            let droppableBelow = null;
            elemBelow.some((item) => droppableBelow = item.closest('.droppable'));

            if (currentDroppable != droppableBelow) {
                // we're flying in or out...
                // note: both values can be null
                //   currentDroppable=null if we were not over a droppable before this event (e.g over an empty space)
                //   droppableBelow=null if we're not over a droppable now, during this event

                if (currentDroppable) {
                    // the logic to process "flying out" of the droppable (remove highlight)
                    leaveDroppable(currentDroppable);
                }
                currentDroppable = droppableBelow;
                if (currentDroppable) {
                    // the logic to process "flying in" of the droppable
                    enterDroppable(currentDroppable);
                }
            }
        }
    }
    async function isAllowedDrop() {
        var id = selectedElement.getAttribute("id");
        if(id != reports[currentReport].type) {
            console.log(numObjectPlaces);
            if(numObjectPlaces >= 3) {
                await Swal.fire({
                    imageUrl: `weather/${reports[currentReport].type}.svg`,
                    imageHeight: 75,
                    text: 'You need to put this object here.'
                });
            } else
                await Swal.fire({
                    title: 'Hmm...',
                    text: "It doesn't look like that's the right object to put there.",
                    icon: 'error'
                });
            return false;
        } else if(getCityName(currentDroppable) != reports[currentReport].city) {
            Swal.fire({
                title: 'Hmm...',
                text: "It doesn't look like that's the right city.",
                icon: 'error'
            });
            return false;
        }
        if(id == "temperature") {
            let { value: degrees } = await Swal.fire({
                title: 'What temperature do you want to enter?',
                icon: 'question',
                input: 'range',
                inputAttributes: {
                    min: 10,
                    max: 80,
                    step: 1
                },
                inputValue: 32
            });
            degrees = parseInt(degrees);
            if(degrees != reports[currentReport].degrees) {
                Swal.fire({
                    title: 'Hmm...',
                    text: "That's not the right temperature.",
                    icon: 'error'
                });
                return false;
            }
            selectedElement.querySelector("tspan").textContent = degrees + " °F";
        }
        numObjectPlaces = 0;
        return true;
    }
    async function endDrag(evt) {
        if (currentDroppable) {
            selectedElement.style.display = "none";
            if(await isAllowedDrop()) {
                selectedElement.style.display = "inline";
                selectedElement.classList.remove("draggable");
                console.log(selectedElement);
                mapGroup.appendChild(selectedElement);
                const { x, y } = panzoom.getPan();
                const cityBBOX = clickArea.getBBox();
                const cityX = cityBBOX.x + cityBBOX.width / 2;
                const cityY = cityBBOX.y + cityBBOX.height / 2;
                const scaleFactor = (selectedElement.tagName.toLowerCase() == "text") ? 1 : 2;
                const origX = lastDX - (x*2);
                const origY = lastDY - (y*2);
                const myBBOX = selectedElement.getBBox();
                //  (-parseFloat(selectedElement.getAttribute("data-xoffset")) * 2) + 
                //  (-parseFloat(selectedElement.getAttribute("data-yoffset")) * 2) + 
                const xoff = parseFloat(selectedElement.getAttribute("data-xoffset"));
                const yoff = parseFloat(selectedElement.getAttribute("data-yoffset"));
                const finalX = (cityX) * 2 - xoff - myBBOX.width / (2*scaleFactor); //origX; // (cityBBOX.x * 2) - (xoff * 2) + (reports[currentReport].targetPoint[0] * 2);
                const finalY =  (cityY) * 2 - yoff - myBBOX.height / (2*scaleFactor); // (cityBBOX.y * 2) - (yoff) + (reports[currentReport].targetPoint[1] * 2);
                transform.setTranslate(finalX, finalY);
                var translate = svg.createSVGTransform();

                const s = 0.5; // (panzoom.getScale());
                translate.setScale(s, s);
                selectedElement.transform.baseVal.insertItemBefore(translate, 0);
                if(reports[currentReport].rotation) {
                    var rotate = svg.createSVGTransform();
                    var bbox = getBBox(selectedElement);
                    const { x, y } = panzoom.getPan();
                    var px = (bbox.x/2)+(bbox.width/4)-x;
                    var py = (bbox.y/2)+(bbox.height/4)-y;
                    pivotPoint.setAttribute("cx", px);
                    pivotPoint.setAttribute("cy", py);
                    rotate.setRotate(reports[currentReport].rotation, px, py);
                    
                    selectedElement.transform.baseVal.insertItemBefore(rotate, 0);
                }
                
                selectedElement.classList.add("dropped-item");
                const bbox3 = selectedElement.getBBox();
                const gc = document.querySelector("#game-container");
                gc.classList.remove("sky-anim");
                gc.classList.add("sky-anim");
                correctSound.play();
                setTimeout(() => gc.classList.remove("sky-anim"), 2000);
                setupForReport(currentReport + 1);
            } else {
                numObjectPlaces++;
                selectedElement.remove();
            }
        }
        else if (selectedElement) {
            Swal.fire({
                title: 'Hmm...',
                text: "It doesn't look like that's the right spot.",
                icon: 'error'
            });
            numDragTries++;
            if(numDragTries >= 2) {
                clickArea.setAttribute("stroke", "#ff00ff");
            }
            selectedElement.remove();
        }
        selectedElement = null;
        currentDroppable = null;
    }
}

function makeCityDroppable(city, targetPoint) {
    numDragTries = 0;
    numObjectPlaces = 0;
    var clickGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    city.parentNode.insertBefore(clickGroup, city);
    clickGroup.appendChild(city);
    clickGroup.classList.add("droppable");
    clickArea = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    clickArea.setAttribute("fill", "transparent");
    clickArea.setAttribute("strokeWidth", "0");
    clickArea.setAttribute("stroke", "none"); //#ff00ff");
    const CW = reports[currentReport].cw ||  50;
    const CH = reports[currentReport].ch || 25;
    clickArea.setAttribute("width", CW);
    clickArea.setAttribute("height", CH);
    var tBBox = city.getBBox();
    clickArea.setAttribute("x", parseFloat(city.getAttribute("x")) + targetPoint[0] - (CW / 2) + tBBox.width / 2);
    clickArea.setAttribute("y", parseFloat(city.getAttribute("y")) + targetPoint[1] - (CH / 2) - tBBox.height / 4);
    clickGroup.appendChild(clickArea);
    clickArea.classList.add("droppable-rect");

    var cityName = getCityName(city);
    var offset = getElementOffsetFromSVG(city);

    stateGroup = city.parentNode;
    if (stateGroup.tagName.toLowerCase() != "g") {
        throw new Error("City without group: " + cityName);
    }
}
function findCity(name) {
    let val = cities.filter(city => getCityName(city) == name)[0] || null;
    if(val == null) {
        console.error("Could not find city, available cities are:");
        console.error(cities.map(city => getCityName(city)).join(", "));
    }
    return val;
}

function setFakeWeatherIconId(id) {
    var uiSvg = svg.querySelector("#ui-container");
    var icon = uiSvg.querySelector("#" + id).cloneNode(true);
    icon.setAttribute("transform", "matrix(0.44330102,0,0,0.44330102,419.53092,192.24434)");
    var placeholder = fakeWeather.querySelector("#weather-placeholder");
    placeholder.replaceWith(icon);
    icon.setAttribute("id", "weather-placeholder");
}
function setupForReport(i) {
    if(i > (reports.length - 1)) {
        reportFinished = true;
        Swal.fire({
            icon: 'success',
            title: 'Great job!',
            text: "You've finished the game!",
            showCancelButton: false,
            showConfirmButton: false,
            allowOutsideClick: false,
            allowEnterKey: false,
            allowEscapeKey: false
        });
        return;
    }
    document.querySelector(".weather-predict").style.display = "none";
    currentReport = i;
    city = findCity(reports[i].city);
    const droppables = document.querySelectorAll(".droppable");
    if(droppables)
        droppables.forEach(droppable => {
            droppable.querySelector(".droppable-rect").remove();
            droppable.classList.remove("droppable");
        });
    makeCityDroppable(city, reports[i].targetPoint);
    document.querySelector(".weather-report-info").textContent = reports[i].description;
    document.querySelector(".weather-report-title").textContent = "Weather report for " + getCityName(city) + ":";
}

let weatherChunks = [
    {
        id: "garfunkel",
        x: 30,
        y: 30,
        components: [
            { name: "partly-cloudy", x: 0, y: 0 }
        ]
    }
];

const BASE_TEMPERATURE = 70;


async function setupForPredict(cities) {
    let swalPromise = null;
    let swalPromiseResolved = false;
    let welcomeShown = false;
    try {
        welcomeShown = window.sessionStorage.getItem('shownWelcome');
    } catch(e) {
        console.error(e);
    }
    if(!welcomeShown)
        swalPromise = showPredictDoc();
    else {
        swalPromise = Promise.resolve();
        swalPromiseResolved = true;
    }
    const { default: React } = await import(/* webpackChunkName: "react" */ "react");
    const { default: ReactDOM } = await import(/* webpackChunkName: "react" */ "react-dom");
    const { default: useIsMounted } = await import(/* webpackChunkName: "react" */ "react-is-mounted-hook");
    const { default: useForceUpdate } = await import(/* webpackChunkName: "react" */ "use-force-update");

    function useRaf(callback, isActive) {
        const savedCallback = React.useRef();
        // Remember the latest function.
        React.useLayoutEffect(() => {
          savedCallback.current = callback;
        }, [callback]);
      
        React.useLayoutEffect(() => {
          let startTime, animationFrame;
      
          function tick() {
            const timeElapsed = Date.now() - startTime;
            startTime = Date.now();
            loop();
            savedCallback.current && savedCallback.current(timeElapsed);
          }
      
          function loop() {
            animationFrame = raf(tick);
          }
      
          if (isActive) {
            startTime = Date.now();
            loop();
            return () => {
              raf.cancel(animationFrame);
            };
          }
        }, [isActive]);
    }

    class WeatherChunk extends React.Component {
        constructor(props) {
            super(props);
            this.groupRef = React.createRef(null);
            this.weatherTargetPoint = React.createRef(null);
        }
        getWeatherConditions() {
            const { cloudCover, temperature } = this.props;
            if(cloudCover >= 85 && temperature >= BASE_TEMPERATURE)
                return "thunderstorm";
            else if(cloudCover >= 75)
                return "rain";
            else if(cloudCover >= 25)
                return "partly-cloudy";
            else
                return "sunny";
        }
        render() {
            let frontColor = null;
            const windSpeed = this.props.windSpeed;
            const x = this.props.x || 0;
            const y = this.props.y || 0; 
            let hideFront = true;
            let angle = this.props.angle;
            return <g ref={this.groupRef} transform={`rotate(0.0001) translate(${x} ${y})`} style={{overflow: "visible", opacity: this.props.opacity }}>
                {/*<circle cx={0} cy={0} r={30}/>*/}
                <text x={0} y={0}>
                    <tspan>{this.props.temperature + " °F"}</tspan>
                </text>
                <image x={-15} y={0} width={40} height={40} xlinkHref={`weather/${this.getWeatherConditions()}.svg`}/>
                <g style={{ opacity: 0 }} className="fake-weather-group" transform={`rotate(${angle - 45} 0 0) scale(6 6) translate(2.044 -1.332)`} strokeWidth={1.8} fill={frontColor} stroke={frontColor}>
                    <path d="M6.33 1.332a8.375 8.375 0 01-8.374 8.374" fill="none"/>
                    <circle r={0.808} cy={9.919} cx={1.853} stroke="none" />
                    <circle cx={3.953} cy={8.738} r={0.808} stroke="none" />
                    <circle r={0.808} cy={7.037} cx={5.602} stroke="none" />
                    <circle cx={6.645} cy={4.986} r={0.808} stroke="none" />
                    <circle r={0.808} cy={2.826} cx={7.145} stroke="none" />
                    <circle cx={-0.338} cy={10.374} r={0.808} stroke="none" />
                    <circle r={0.808} cy={15.037} cx={10.602} ref={this.weatherTargetPoint} fill="none" stroke="none" />
                </g>
                <g fill="#000" fillOpacity="1" transform={`scale(0.1 0.1) translate(-150 -450) rotate(${angle + 90} 38.5 160)`}>
                    {windSpeed > 0 && <path
                    strokeWidth="1.8"
                    d="M78.323 45.314H26.536L39.483 22.89 52.43.465 65.376 22.89z"
                    ></path>}
                    {windSpeed > 0 && <path
                    strokeWidth="1.697"
                    d="M47.42 41.704H56.503V256.718H47.42z"
                    ></path>}
                    {windSpeed >= 40 && <path
                    strokeWidth="1.8"
                    d="M-173.776 -142.329H-92.465V-135.203H-173.776z"
                    transform="scale(1 -1) rotate(52.458)"
                    ></path>}
                    {windSpeed >= 30 && <path
                    strokeWidth="1.8"
                    d="M-199.49 -162.09H-118.179V-154.964H-199.49z"
                    transform="scale(1 -1) rotate(52.458)"
                    ></path>}
                    {windSpeed >= 20 && <path
                    strokeWidth="1.8"
                    d="M-225.205 -181.851H-143.894V-174.725H-225.205z"
                    transform="scale(1 -1) rotate(52.458)"
                    ></path>}
                    {windSpeed >= 10 && <path
                    strokeWidth="1.8"
                    d="M-250.919 -201.612H-169.608V-194.486H-250.919z"
                    transform="scale(1 -1) rotate(52.458)"
                    ></path>}
                </g>
            </g>;
        }
    }
    var city = null;
    document.querySelector(".weather-report").style.display = "none";
    var predictPopup = document.querySelector(".predict-popup");
    let predictPopupPoints = predictPopup.querySelector(".predict-popup-points");
    var predictPopupInput = predictPopup.querySelector(".predict-temperature input[type=range]");
    var predictWindspeedInput = predictPopup.querySelector(".predict-windspeed input[type=range]");
    predictPopupInput.value = "30";
    var predictPopupInputLabel = predictPopup.querySelector(".predict-temperature .slider-row span");
    var predictPopupWindSpeedInputLabel = predictPopup.querySelector(".predict-windspeed .slider-row span");
    var predictSubmitButton = predictPopup.querySelector(".predict-submit-button");
    var predictSubmitWindspeedButton = predictPopup.querySelector(".predict-submit-windspeed-button");
    const popupInputListener = () => {
        predictPopupInputLabel.textContent = (predictPopupInput.value) + " °F";
    };
    const windSpeedInputListener = () => {
        predictPopupWindSpeedInputLabel.textContent = predictWindspeedInput.value + " mph";
    };
    predictPopupInput.addEventListener("input", popupInputListener);
    predictWindspeedInput.addEventListener("input", windSpeedInputListener);
    predictPopupInput.addEventListener("change", popupInputListener);
    predictWindspeedInput.addEventListener("change", windSpeedInputListener);
    let weatherPredictPoints;
    function updateCurrentPoints(delta) {
        currentPoints += delta;
        predictPopupPoints.textContent = `${delta} point${Math.abs(delta) == 1 ? "" : "s"}`;
        predictPopupPoints.style.color = (delta > 0) ? 'green' : 'red';
        predictPopupPoints.classList.add("predict-popup-points-shown");
        predictPopup.classList.add("predict-popup-closed");
        movePivotPoint();
        weatherPredictPoints.textContent = `${currentPoints} point${currentPoints == 1 ? "" : "s"}`;
    }
    var trackTransition = false;
    const transitionTrackLoop = () => {
        movePivotPoint();
        if(trackTransition)
            requestAnimationFrame(transitionTrackLoop);
    }
    predictPopup.addEventListener("click", () => {
        predictPopup.classList.remove("predict-popup-closed");
        movePivotPoint();

    });
    predictPopup.querySelector(".predict-close-button").addEventListener("click", (e) => {
        e.stopPropagation();
        predictPopup.classList.add("predict-popup-closed");
        e.preventDefault();
        movePivotPoint();
    });
    predictPopup.addEventListener("transitionstart", () => {
        trackTransition = true;
        transitionTrackLoop();
    });
    predictPopup.addEventListener("transitionend", () => {
        trackTransition = false;
    });
    predictPopup.addEventListener("transitioncancel", () => {
        trackTransition = false;
    });
    var predictPopupHeader = predictPopup.querySelector("b");
    var dragMove = false;
    const movePivotPoint = () => {
        let bRect = pivotPoint.getBoundingClientRect();

        const x = bRect.left + (bRect.width / 2);
        const y = bRect.top - (bRect.height);
        const oldDisplayValue = predictPopup.style.display;
        predictPopup.style.display = '';
        const popupRect = predictPopup.getBoundingClientRect();
        predictPopup.style.display = oldDisplayValue;
        predictPopup.style.transform =
            `translateX(${Math.round(Math.min(window.innerWidth - (popupRect.width), Math.max(0, x - (popupRect.width / 2))))}px) ` +
            `translateY(${Math.round(Math.min(window.innerHeight - (popupRect.height * 2), Math.max(0, y)))}px)`;
    };
    let predictVisible = false;
    let currentPredictMode = 0;
    weatherPredictPoints = document.querySelector(".weather-predict-points");

    function hidePredict() {
        predictPopup.classList.add("predict-popup-hidden");
        predictPopup.classList.add("predict-popup-closed");
        movePivotPoint();
        predictVisible = false;
        cities.forEach(c => {
            c.style.visibility = 'hidden';
        });
    }
    hidePredict();
    function WeatherContainer() {
        const chunkCoordsRef = React.useRef([]);
        const isMounted = useIsMounted();
        const forceUpdate = useForceUpdate();
        const frameRef = React.useRef({ num: 0 });
        useRaf((timeElapsed) => {
            if(!swalPromiseResolved || currentPoints <= POINT_FAIL_THRESHOLD)
                return;
            const delta = Math.max(1, timeElapsed / 16);
            frameRef.current.num += delta;
            chunkCoordsRef.current.forEach((coord, i) => {
                if(coord[7] <= 0) {
                    chunkCoordsRef.current.splice(i, 1);
                    forceUpdate();
                    return;
                } else if(coord[7] < 1) {
                    coord[7] = Math.max(0, coord[7] - (0.01 * delta));
                    forceUpdate();
                } else if(coord[8] <= 0) {
                    coord[7] = 0.9999;
                }
                const angle = coord[2];
                const dx = Math.cos(angle * (Math.PI/180)) * coord[6];
                const dy = Math.sin(angle * (Math.PI/180)) * coord[6];
                const rdx = dx / (1500 * delta);
                const rdy = dy / (1500 * delta);
                coord[0] += rdx;
                coord[1] += rdy;
                if(!isFinite(coord[0]) || !isFinite(coord[1])) {
                    console.error("INFINITE POS");
                    chunkCoordsRef.current.splice(i, 1);
                    forceUpdate();
                    return;
                }
            });
            if((frameRef.current.num % 15) == 0)
                forceUpdate();
        }, true);
        const getWeatherAtPoint = (point, selfRef) => {
            let weatherObj = { cloudCover: 0, temperature: 0, windSpeed: 0, alwaysHide: true };
            const MAX_DISTANCE = 200;
            let biggestDistance = 0;
            const sortedCoords = chunkCoordsRef.current.filter(coord => {
                const realDistance = Math.pow(coord[1] - point.y, 2) + Math.pow(coord[0] - point.x, 2);
                const valid = realDistance <= MAX_DISTANCE;
                coord.chunkDistance = MAX_DISTANCE-realDistance;
                if(valid) {
                    biggestDistance = Math.max(biggestDistance, coord.chunkDistance);
                }
                return valid;
            });

            let sll = sortedCoords.length;

            if(sortedCoords.length == 0) {
                weatherObj.temperature = BASE_TEMPERATURE;
                weatherObj.cloudCover = 0;
                weatherObj.windSpeed = 0;
            } else {
                let weightSum = 0;
                let totalDistance = sortedCoords.reduce((prev, cur) => prev + (cur == selfRef ? 0 : cur.chunkDistance), 0);
                for(var i = 0; i < sortedCoords.length; i++) {
                    var coord = sortedCoords[i];
                    if(coord == selfRef) {
                        sll--;
                        continue;
                    }
                    if(coord.chunkDistance == 0) {
                        weatherObj.temperature = coord[5];
                        weatherObj.cloudCover = coord[4];
                        weatherObj.windSpeed = coord[6];
                        break;
                    }
                    
                    let relativeWeight = coord.chunkDistance / totalDistance;
                    weightSum += relativeWeight;
                    weatherObj.temperature += relativeWeight * coord[5];
                    weatherObj.cloudCover += relativeWeight * coord[4];
                    weatherObj.windSpeed += relativeWeight * coord[6];
                    weatherObj.alwaysHide = false;
                }
                console.log(sll, weightSum);
            }
            
            return weatherObj;
        };
        React.useEffect(() => {
            (async function() {
                let iterations = 1;

                const pickNewCity = () => {
                    city = cities[getRandomInt(0, cities.length)];
                    cities.forEach(c => {
                        c.style.visibility = (c != city) ? 'hidden' : 'visible';
                    });
                };
                const onCloudClick = (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    var myValue = e.currentTarget.getAttribute("data-cloudcover");
                    var myCloudCover;
                    var w = getWeatherAtPoint(pivotPoint.getBBox());
                    var correctAnswer = w.cloudCover;
                    if(myValue == "thunderstorm")
                        myCloudCover = 85;
                    else if(myValue == "rain")
                        myCloudCover = 75;
                    else if(myValue == "partly-cloudy")
                        myCloudCover = 25;
                    else
                        myCloudCover = 0;
                    
                    var diff = Math.abs(myCloudCover - correctAnswer);
                    console.log(diff);
                    console.log(w);
                    const maxDiff = 25;
                    
                    if(diff > maxDiff) {
                        updateCurrentPoints(-10);
                    } else {
                        updateCurrentPoints(Math.round(10 * (1-(diff/maxDiff))));
                    }
                    hidePredict();
                    iterations = 1;
                };
                predictPopup.querySelectorAll(".predict-cloudcover-option").forEach(btn => btn.addEventListener("click", onCloudClick));
                const predictForRandomPoint = () => {
                    let distance;
                    let midX, midY;
                    do {
                        distance = Number.MAX_VALUE;
                        pickNewCity();
                        const bbox = city.getBBox();
                        const DIST = 25;
                        midX = (bbox.x + (bbox.width / 2)) + getRandomArbitrary(-DIST, DIST);
                        midY = (bbox.y + (bbox.height / 2)) + getRandomArbitrary(-DIST, DIST);
                        for(var j = 0; j < chunkCoordsRef.current.length; j++) {
                            const coord = chunkCoordsRef.current[j];
                            distance = Math.min(distance, Math.sqrt(Math.pow(coord[1] - midY, 2) + Math.pow(coord[0] - midX, 2)));
                        }
                    } while(distance < 50);

                    pivotPoint.setAttribute("cx", midX);
                    pivotPoint.setAttribute("cy", midY);
                    movePivotPoint();
                    const names = [ "cloudcover", "temperature", "windspeed" ];
                    currentPredictMode = getRandomInt(0, names.length);
                    predictPopup.querySelectorAll(".predict-option").forEach(predict => {
                        predict.style.display = (predict.classList.contains("predict-" + names[currentPredictMode])) ? '' : "none";
                    });
                    const realName = (names[currentPredictMode] == "cloudcover") ? "conditions" : names[currentPredictMode];
                    predictPopupHeader.textContent = `What do you think the ${realName} in this part of ` + getCityName(city) + ` will be?`;
                    
                    predictPopup.classList.remove("predict-popup-hidden");
                    predictPopup.style.display = '';
                    predictPopup.classList.add("predict-popup-closed");
                    predictPopupPoints.classList.remove("predict-popup-points-shown");
                };
                predictSubmitWindspeedButton.addEventListener("click", (e) => {
                    e.stopPropagation();
                    var tmp = parseInt(predictWindspeedInput.value);
                    var real = getWeatherAtPoint(pivotPoint.getBBox()).windSpeed;
                    var diff = Math.abs(real - tmp);
                    console.log(tmp, real, diff);
                    const maxDiff = 20;
                    if(diff > maxDiff) {
                        updateCurrentPoints(-10);
                    } else {
                        updateCurrentPoints(Math.round(10 * (1-(diff/maxDiff))));
                    }
                    hidePredict();
                    iterations = 1;
                })
                predictSubmitButton.addEventListener("click", (e) => {
                    e.stopPropagation();
                    var tmp = parseInt(predictPopupInput.value);
                    var real = getWeatherAtPoint(pivotPoint.getBBox()).temperature;
                    var diff = Math.abs(real - tmp);
                    const maxDiff = 20;
                    if(diff > maxDiff) {
                        updateCurrentPoints(-10);
                    } else {
                        updateCurrentPoints(Math.round(10 * (1-(diff/maxDiff))));
                    }
                    hidePredict();
                    iterations = 1;
                })
                removeLoader();
                await swalPromise;
                swalPromiseResolved = true;
                try {
                    window.sessionStorage.setItem('shownWelcome', true);
                } catch(e) {
                    console.error(e);
                }
                let spawnSuccess = false;
                const COMPLAIN_THRESHOLD = -1;
                while(isMounted()) {
                    if(currentPoints > POINT_FAIL_THRESHOLD && chunkCoordsRef.current.length < 50) {
                        for(var i = 0; i < 10; i++) {
                            let isStatic = !(Math.random() >= 0.75);
                            let x = getRandomArbitrary(0, 900);
                            let angle = getRandomArbitrary(0, 360);
                            let cloudCover = getRandomInt(0, 6) * 20;
                            if(cloudCover >= 75)
                                isStatic = false;
                            let y = getRandomArbitrary(100, isStatic ? 500 : 600);
                            let temperatureF = getRandomInt(50, 113);
                            let windSpeed = (!isStatic ? (getRandomInt(1, 5) * 10) : 0);

                            let coordSet = [ x, y, angle, 0, cloudCover, temperatureF, windSpeed, 1, 50 ];
                            let tooClose = false;
                            let distance = 0;
                            for(var j = 0; j < chunkCoordsRef.current.length; j++) {
                                const coord = chunkCoordsRef.current[j];
                                distance = Math.sqrt(Math.pow(coord[1] - coordSet[1], 2) + Math.pow(coord[0] - coordSet[0], 2))
                                if(distance < 100) {
                                    tooClose = true;
                                    break;
                                }
                            }
                            if(tooClose)
                                continue;
                            //console.log("Spawn", coordSet[4], coordSet[5]);
                            chunkCoordsRef.current.push(coordSet);
                            forceUpdate();
                            spawnSuccess = true;
                            break;
                        }
                    }
                    if(!spawnSuccess || chunkCoordsRef.current.length > COMPLAIN_THRESHOLD) {
                        if(chunkCoordsRef.current.length > COMPLAIN_THRESHOLD && (iterations % (predictVisible ? 35 : 4)) == 0) {
                            if(currentPoints >= 100) {
                                await Swal.fire({
                                    icon: 'success',
                                    title: 'Great job',
                                    text: "You've finished the game!",
                                    confirmButtonText: "Play again",
                                });
                                window.location.reload(false);
                            } else if(predictVisible) {
                                hidePredict();
                                updateCurrentPoints(-5);
                            } else if(currentPoints > POINT_FAIL_THRESHOLD) {
                                predictVisible = true;
                                predictForRandomPoint();
                            } else {
                                await Swal.fire({
                                    icon: 'error',
                                    title: 'Uh oh',
                                    text: "You've been too inaccurate with your predictions, and your fellow meteorologists have decided to fire you!",
                                    confirmButtonText: "Try again",
                                });
                                window.location.reload(false);
    
                            }
                            iterations = 0;
                        }
                        /* decrease lifetime */
                        chunkCoordsRef.current.forEach(coord => coord[8] = Math.max(0, coord[8] - getRandomArbitrary(0.5, 3)));
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        iterations++;
                    }
                }
            })();
        }, []);
        return chunkCoordsRef.current.map((coord, index) => {
            return <WeatherChunk getWeatherAtPoint={getWeatherAtPoint} selfIndex={index} otherChunks={chunkCoordsRef.current} key={index} x={coord[0]} y={coord[1]} angle={coord[2]} cloudCover={coord[4]} temperature={coord[5]} windSpeed={coord[6]} opacity={coord[7]}/>;
        });
    }
    ReactDOM.render(<WeatherContainer/>, reactGroup);
    
    mapGroup.addEventListener("panzoomstart", () => {
        dragMove = true;
        console.log("start pan");
    });
    mapGroup.addEventListener("mousemove", () => {
        if(dragMove)
            movePivotPoint(); 
    });
    mapGroup.addEventListener("panzoomchange", movePivotPoint);
    mapGroup.addEventListener("panzoomend", () => {
        movePivotPoint();
        console.log("end pan");
        dragMove = false;
    });
    window.addEventListener("resize", movePivotPoint);
    setTimeout(() => movePivotPoint());
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function startTimer() {
    const timer = document.querySelector(".report-timer");
    timer.style.display = '';
    let timeLeft = 300;
    const timerProc = async() => {
        if(reportFinished)
            return;
        if(timeLeft > 0) {
            timer.textContent = timeLeft--;
            setTimeout(timerProc, 1000);
        } else {
            timer.textContent = "0";
            await Swal.fire({
                icon: 'error',
                title: 'Oops!',
                text: 'You ran out of time!',
                confirmButtonText: "Play again"
            });
            window.location.reload(false);
        }
    }
    timerProc();
}

fetch('state.svg')
    .then(r => r.text())
    .then(async(text) => {
        document.getElementById("game-container").innerHTML = text;
        svg = document.getElementById("game-container").querySelector("svg");
        svg.style.overflow = "hidden";
        mapGroup = svg.querySelector("#map-group");
        reactGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

        svg.querySelectorAll("tspan").forEach(tspan => tspan.textContent = tspan.textContent.replace("*", "")); // ⍟
        svg.querySelectorAll("title").forEach(title => title.remove());
        svg.querySelector("#AK").remove();
        svg.querySelector("#HI").remove();
        svg.querySelector("#path4503").remove();
        reports = availableReports[parseInt(getParameterByName("level"))];
        let isPredict = getParameterByName("predict") == "true";
        document.querySelectorAll(".help-button").forEach(btn => btn.addEventListener("click", async() => {
            await showSymbolDoc();
            if(isPredict)
                await showPredictDoc();
            else
                await showReportDoc();
        }));
        panzoom = Panzoom(mapGroup, {
            maxScale: isPredict ? 6 : 2,
            minScale: isPredict ? 1 : 2,
            overflow: "hidden",
        })
        panzoom.zoom(2, { animate: true })

        svg.parentElement.addEventListener('wheel', panzoom.zoomWithWheel);

        cities = Array.from(svg.querySelectorAll("text")).filter(city => city.parentNode.tagName.toLowerCase() == "g" && getCityName(city).trim().length > 0);

        
        pivotPoint = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        pivotPoint.setAttribute("r", "10");
        pivotPoint.setAttribute("cx", 100);
        pivotPoint.setAttribute("cy", 100);
        pivotPoint.setAttribute("fill", "none");
        mapGroup.appendChild(pivotPoint);
        let symbolsShown = false;
        try {
            symbolsShown = window.sessionStorage.getItem('shownSymbols');
        } catch(e) {
            console.error(e);
        }
        if(!symbolsShown) {
            await showSymbolDoc();
            try {
                window.sessionStorage.setItem('shownSymbols', true);
            } catch(e) {
                console.error(e);
            }
        }
        if(!isPredict) {
            startTimer();
            let reportInstrsShown = false;
            try {
                reportInstrsShown = window.sessionStorage.getItem('reportInstrsShown');
            } catch(e) {
                console.error(e);
            }
            if(!reportInstrsShown) {
                await showReportDoc();
                try {
                    window.sessionStorage.setItem('reportInstrsShown', true);
                } catch(e) {
                    console.error(e);
                }
            }
            setupForReport(0);
            uiSvg = svg.querySelector("#ui-container");
            makeDraggable(svg);
            Array.from(uiSvg.childNodes).forEach(node => {
                if (node.nodeType == Node.ELEMENT_NODE && node.tagName.toLowerCase() != "rect" && node.tagName.toLowerCase() != "script") {
                    node.classList.add("draggable");
                }
            });
            removeLoader();
        } else {
            setupForPredict(cities);
            svg.querySelector("#ui-container").remove();
        }
        /*
        for (var y = -EXTRA_MARGIN; y < (svg.height.baseVal.value + EXTRA_MARGIN); y += CHUNK_HEIGHT) {
            for (var x = -EXTRA_MARGIN; x < (svg.width.baseVal.value + EXTRA_MARGIN); x += CHUNK_WIDTH) {
                var chunk = { pressure: 0, temperature: 0, windSpeed: 0, windDirection: 0 };
                var id = chunkDataArray.push({}) - 1;
                chunk.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                mapGroup.appendChild(chunk.svg);
                chunk.svg.setAttribute("width", CHUNK_WIDTH);
                chunk.svg.setAttribute("height", CHUNK_HEIGHT);
                chunk.svg.setAttribute("x", x);
                chunk.svg.setAttribute("y", y);
                chunk.svg.setAttribute("data-chunkId", id);
                
                var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                rect.setAttribute("x", 0);
                rect.setAttribute("y", 0);
                rect.setAttribute("width", CHUNK_WIDTH);
                rect.setAttribute("height", CHUNK_HEIGHT);
                rect.setAttribute("opacity", 0.5);
                chunk.svg.appendChild(rect);
              
                chunkColumns++;
            }
            chunkRows++;
        }
        */
        cities.forEach(city => city.parentNode.parentNode.appendChild(city.parentNode));

        mapGroup.appendChild(reactGroup);
        const DELTA = 8;

        document.onkeydown = function(e) {
            switch (e.keyCode) {
                case 37:
                    panzoom.pan(DELTA, 0, { relative: true });
                    break;
                case 38:
                    panzoom.pan(0, DELTA, { relative: true });
                    break;
                case 39:
                    panzoom.pan(-DELTA, 0, { relative: true });
                    break;
                case 40:
                    panzoom.pan(0, -DELTA, { relative: true });
                    break;
            }
        };
    })
    .catch(console.error.bind(console));