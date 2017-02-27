	var freqTextPadding = 10;
	var piData = [];

	function isEmpty(obj) {
		for (var key in obj) {
			if (obj.hasOwnProperty(key))
				return false;
		}
		return true;
	}
	var isDragged = false;

	var margin = {
			top: 20,
			right: 30,
			bottom: 30,
			left: 30
		},
		width = 960 - margin.left - margin.right,
		height = 500 - margin.top - margin.bottom;

	var padding = 15;
	var y, x, svg;
	var currDataSet = [];

	var mouseX = 0;
	var mouseMoveLeft = false;
	var binSize = 15;

	function debounceD3Event(func, wait, immediate) {
		var timeout;
		return function() {
			var context = this;
			var args = arguments;
			var evt = d3.event;

			var later = function() {
				timeout = null;
				if (!immediate) {
					var tmpEvent = d3.event;
					d3.event = evt;
					func.apply(context, args);
					d3.event = tmpEvent;
				}
			};

			var callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) {
				var tmpEvent = d3.event;
				d3.event = evt;
				func.apply(context, args);
				d3.event = tmpEvent;
			}

		};
	}

	function handled3Drag(context, args) {
		if (args < 0) {
			if (binSize > 1) binSize--;
		} else {
			if (binSize < 20) binSize++;
		}
		console.log("currDataSet:",currDataSet);
		changeVal(currDataSet);
	}

	var debouncedHandlemouseDrag = debounceD3Event(handled3Drag, 50);

	var drag = d3.behavior.drag()
		.on("dragstart", function() {
			isDragged = true;
			d3.event.sourceEvent.stopPropagation();
		})
		.on("drag", function(d, i) {
			debouncedHandlemouseDrag(this, d3.event.dx);
		})
		.on("dragend", function() {
			isDragged = false;
		});


	var xScale, yScale;
	var origYVal, origXVal;
	var xAxis;
	var color = "blue";
	var formatCount = d3.format(",.0f");
	var prevX = -1;
	var dataSet1 = [],
		dataSet2 = [];
	d3.csv("baseball_data.csv", function(data) {
		data.map(function(d) {
			dataSet1.push(parseFloat(d.avg));
			dataSet2.push(parseInt(d.HR));
		});
		getData(dataSet1);
	});
	var freqText;

	function getData(dataSet) {

		// var newData = eval(d3.select(this).property('value'));
		currDataSet = dataSet;

		document.getElementById("Chart").innerHTML = "";
		svg = d3.select("body").select("#Chart").append("svg").call(drag)
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom);

		var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")")
		var max = d3.max(dataSet);
		var min = d3.min(dataSet);
		x = d3.scale.linear()
			.domain([min, max])
			.range([0, width]);

		var data = d3.layout.histogram()
			.bins(x.ticks(binSize))(dataSet);
		piData = data;
		console.log("data here:", data);
		var yMax = d3.max(data, function(d) {
			return d.length
		});
		var yMin = d3.min(data, function(d) {
			return d.length
		});

		var colorScale = d3.scale.linear()
			.domain([yMin, yMax])
			.range([d3.rgb(color).brighter(), d3.rgb(color).darker()]);

		y = d3.scale.linear()
			.domain([0, yMax])
			.range([height, 0]);

		xAxis = d3.svg.axis()
			.scale(x)
			.orient("bottom");

		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(" + padding + "," + parseInt(parseInt(height) + parseInt(margin.top)) + ")");

		svg.selectAll("g.x.axis").transition().duration(500).transition().duration(500).call(xAxis);

		var bar = svg.selectAll("rect")
			.data(data)
			.enter().append("rect")

		bar.transition()
			.duration(1000)
			.attr("x", function(d) {
				console.log("x val", x(d.x));
				return x(d.x) + padding;
			})
			.attr("y", function(d) {
				return y(d.y) + margin.top;
			})
			.attr("id", function(d, i) {
				return i;
			})
			.attr("width", x(data[0].dx) - x(0) - 1 - padding)
			.attr("height", function(d) {
				return height - y(d.y);
			})
			.attr("fill", function(d) {
				return colorScale(d.y)
			});
		bar.on("mouseover", function() {
			heightVal = d3.select(this).attr("height");
			widthVal = d3.select(this).attr("width");
			var newHeight = Math.min(eval(parseInt(heightVal) * 1.3),470);
			console.log("newHeight 2:",newHeight);
			var newWidth = eval(parseInt(widthVal) * 1.3);
			origYVal = d3.select(this).attr("y");
			origXVal = d3.select(this).attr("x");
			d3.select(this)
				.transition()
				.duration(1000)
				.attr("stroke", "white")
				.attr("y", parseInt(origYVal) - (parseInt(newHeight) - parseInt(heightVal)))
				.attr("x", parseInt(origXVal) - ((parseInt(newWidth) - parseInt(widthVal)) / 2))
				.attr("height", newHeight)
				.attr("width", newWidth);

			var rectBar = this;
			freqText = setTimeout(function() {
				if (!isDragged) {
					console.log("is Dragged here", isDragged);
					var textNode = d3.select(rectBar)
						.select(function() {
							return rectBar.parentNode;
						})
						.append("text")
						.text(function(d) {
							return parseInt(d.y);
						})
						.attr("id", "freqText")
						.attr("x", function(d, i) {
							return parseInt(d3.select(rectBar).attr("x")) + ((x(data[0].dx) - x(0) - 1) / 4)+5;
						})
						.attr("y", function(d) {
							return parseInt(d3.select(rectBar).attr("y")) + freqTextPadding;
						})
						.attr("font-size", "11px")
						.attr("fill", "white");
				}

			}, 1000);
		});
		bar.on("mouseleave", function(d) {
			clearTimeout(freqText);
			d3.select(this).transition()
				.attr("height", heightVal)
				.attr("width", widthVal)
				.attr("stroke", "none")
				.attr("y", origYVal)
				.attr("stroke-width", 6)
				.attr("x", origXVal);
			var lastNode = d3.select(this)
				.select(function() {
					console.log("this.parentNode.lastChild:", this.parentNode.lastChild);
					return this.parentNode.lastChild;
				});
			if (lastNode.attr("id") == "freqText") {
				lastNode.remove();
			}

		});

		// svg.append("text")  

	}

	function changeVal(dataSet) {
		console.log("arguments[i]:", arguments[1]);
		if (arguments[1]) binSize = arguments[1];
		if (!dataSet) dataSet = currDataSet;
		var max = d3.max(dataSet);
		var min = d3.min(dataSet);

		x = d3.scale.linear()
			.domain([min, max])
			.range([0, width]);
		xAxis = d3.svg.axis()
			.scale(x)
			.orient("bottom");
			svg.selectAll("g.x.axis")
			.transition().duration(500).call(xAxis);
		currDataSet = dataSet;
		var data = d3.layout.histogram()
			.bins(binSize)
			(dataSet);
		piData = data;
		var buttonVal = document.getElementById("transformButton").textContent;
		if (buttonVal.indexOf("Pi") == -1) {
			createPi();
			return;
		}
		var yMax = d3.max(data, function(d) {
			return d.length;
		});
		var yMin = d3.min(data, function(d) {
			return d.length;
		});
		y.domain([0, yMax]);

		var colorScale = d3.scale.linear()
			.domain([yMin, yMax])
			.range([d3.rgb(color).brighter(), d3.rgb(color).darker()]);
		// var bar = svg.selectAll(".bar").data(data);
		var rect = svg.selectAll("rect").data(data);
		rect.exit().transition()
			.duration(1000)
			.attr("y", y(0))
			.attr("height", height - y(0))
			.remove();

		rect.enter().append("rect")
			.attr("y", function(d) {
				return y(d.y) + margin.top;
			})
			.attr("height", function(d) {
				return height - y(d.y);
			});

		rect.transition()
			.duration(1000).attr("x", function(d) {
				return x(d.x) + padding;
			}).attr("y", function(d) {
				return y(d.y) + margin.top;
			})
			.attr("id", function(d, i) {
				return i;
			})
			.attr("width", x(data[0].dx) - x(0) - 1 - padding)
			.attr("height", function(d) {
				return height - y(d.y);
			})
			.attr("fill", function(d) {
				return colorScale(d.y)
			});
		rect.on("mouseover", function() {
			heightVal = d3.select(this).attr("height");
			widthVal = d3.select(this).attr("width");
			var newHeight = Math.min(eval(parseInt(heightVal) * 1.3),470);
			console.log("newHeight 2:",newHeight);
			var newWidth = eval(parseInt(widthVal) * 1.3);
			origYVal = d3.select(this).attr("y");
			origXVal = d3.select(this).attr("x");
			d3.select(this)
				.transition()
				.duration(1000)
				.attr("stroke", "white")
				.attr("y", parseInt(origYVal) - (parseInt(newHeight) - parseInt(heightVal)))
				.attr("x", parseInt(origXVal) - ((parseInt(newWidth) - parseInt(widthVal)) / 2))
				.attr("height", newHeight)
				.attr("width", newWidth);
			var rectBar = this;
			clearTimeout(freqText);
			freqText = setTimeout(function() {
				if (!isDragged) {
					d3.select(rectBar)
						.select(function() {
							return rectBar.parentNode;
						})
						.append("text")
						.attr("id", "freqText")
						.text(function(d) {
							return parseInt(d.y);
						}).transition().duration(1000)
						.attr("x", function(d, i) {
							return parseInt(d3.select(rectBar).attr("x")) + ((x(data[0].dx) - x(0) - 1) / 4)+5;
						})
						.attr("y", function(d) {
							return parseInt(d3.select(rectBar).attr("y")) + freqTextPadding+1;
						})
						.attr("font-size", "11px")
						.attr("fill", "white");
				}
			}, 1000);

		})
		rect.on("mouseleave", function(d) {
			clearTimeout(freqText);
			d3.select(this).transition()
				.attr("height", heightVal)
				.attr("width", widthVal)
				.attr("stroke", "none")
				.attr("y", origYVal)
				.attr("stroke-width", 6)
				.attr("x", origXVal);
			var lastNode1 = d3.select(this)
				.select(function() {
					console.log("this.parentNode.lastChild:", this.parentNode.lastChild);
					return this.parentNode.lastChild;
				});
			if (lastNode1.attr("id") == "freqText") {
				lastNode1.remove();
			}
		})

		svg.select("text")
			.transition()
			.duration(1000)
			.attr("dy", ".75em")
			.attr("y", 6)
			.attr("x", (x(data[0].dx) - x(0)) / 2)
			.attr("text-anchor", "middle")
			.text(function(d) {
				return formatCount(d.y);
			});

		

	}

	function handleTransform() {
		var text = document.getElementById("transformButton").textContent;
		if (text.indexOf("Pie") != -1) {
			document.getElementById("transformButton").textContent = "View BarChart";
			createPi();
		} else {
			document.getElementById("transformButton").textContent = "View Pie Chart";
			getData(currDataSet);
		}
	}

	function createPi() {
		var radius = Math.min(width, height) / 2;
		radius = 150;
		document.getElementById("Chart").innerHTML = "";

		var arc = d3.svg.arc()
			.outerRadius(radius - 10)
			.innerRadius(0);

		var arcOver = d3.svg.arc()
			.outerRadius(radius + 40).innerRadius(0);

		var color = d3.scale.ordinal()
			.range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00", "#006400",
				"#0000CD", "#6B8E23", "#FA8072", "#EE82EE"
			]);

		var labelArc = d3.svg.arc()
			.outerRadius(radius - 40)
			.innerRadius(radius - 40);

		var pie = d3.layout.pie()
			.sort(null)
			.value(function(d) {
				return d.y
			});

		svg = d3.select("body").select("#Chart")
			.append("svg").call(drag)
			.attr("width", width)
			.attr("height", height).append("g")
			.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");


		var g = svg.selectAll(".arc")
			.data(pie(piData))
			.enter().append("g")
			.attr("class", "arc")

		g.append("path")
			.attr("d", function(d) {
				return arc(d);
			})
			.attr("fill", function(d, i) {
				return color(i);
			})
			.on("mouseover", function(d) {
				console.log("arcover:", arcOver);
				console.log("d.data.y:", d.data.y);
				d3.select(this).transition()
					.duration(1000)
					.attr("d", arcOver);
				console.log("d:", d);
				d3.select("#tooltip")
					.style("left", d3.event.pageX + "px")
					.style("top", d3.event.pageY + "px")
					.style("opacity", 1)
					.attr("zIndex", 10)
					.select("#value")
					.text(d.data.y);
			})
			.on("mouseout", function() {

				d3.select(this).transition()
					.duration(1000)
					.attr("d", arc);
				d3.select("#tooltip")
					.style("opacity", 0);
			});

	}