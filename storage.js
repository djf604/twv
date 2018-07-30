function circleSegmentAreaFromHeight(r, h) {
    return (Math.pow(r, 2) * Math.acos((r - h) / r)) - ((r - h) * Math.sqrt((2 * r * h) - Math.pow(h, 2)));
}


function getCircleSegmentHeights(radius, circles) {
    var heights = [];
    for (var i = 0; i < circles.length; i++) {
        heights.push(1);
    }

    var stepSize = [];
    for (i = 0; i < circles.length; i++) {
        stepSize.push(2);
    }

    var lastDelta = [];
    for (i = 0; i < circles.length; i++) {
        lastDelta.push(999999999);
    }

    var totalArea = Math.PI * Math.pow(radius, 2);
    var proportions = [];
    for (i = 0; i < circles.length; i++) {
        proportions.push(circles[i].percent);
    }

    var desiredAreas = [];
    for (i = 0; i < proportions.length; i++) {
        desiredAreas.push(proportions[i] * totalArea);
    }

    goodEnough = 100;
    while (goodEnough > 0) {
        var currentAreas = [];
        for (i = 0; i < heights.length; i++) {
            currentAreas.push(circleSegmentAreaFromHeight(radius, heights[i]));
        }

        for (i = 0; i < heights.length; i++) {
            if (currentAreas[i] !== desiredAreas[i]) {
                heights[i] += stepSize[i];
                var newArea = circleSegmentAreaFromHeight(radius, heights[i]);
            } else continue;

            if (lastDelta[i] < Math.abs(desiredAreas[i] - newArea)) {
                stepSize[i] /= -2;
            }

            lastDelta[i] = Math.abs(desiredAreas[i] - newArea);
        }

        if (lastDelta.every(function(v) {return v < 0.00001})) {
            break;
        }
        goodEnough -= 1;
    }

    return heights;
}

/*
     * circles must be an array of objects that take the form:
     *     {color: <color>, percent: [0.0, 1.0]}
     *
     * This isn't actually correct because most of my areas aren't based on an arc and a
     * chord, but rather two chords and two arcs. Calculating will actually be a lot
     * trickier even than I thought before.
     */
function placeStackedCircleArea(x, y, radius, circles, parentElement, shouldSort) {
    if (shouldSort === true) {
        circles.sort(function(a,b) {
            if (a.percent < b.percent) return -1;
            if (a.percent > b.percent) return 1;
            return 0;
        });
    }


    var heights = getCircleSegmentHeights(radius, circles);
    var heightsSum = heights.reduce(function(acc, val) { return acc + val; }, 0);
    var heightProportions = heights.map(function(v) {return v / heightsSum});

    // Place first circle, which will always be full
    parentElement.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', radius)
        .style('stroke', 'black')
        .style('fill', circles[0].fill);
    var sum = heightProportions[0] * 100;

    // Place the other partial circles
    for (var s = 1; s < circles.length; s++) {
        var startAngle = sum * 1.8;
        var endAngle = 360 - startAngle;

        // console.log('Placing ' + circles[s].fill + ' at ' + startAngle + ' and ' + endAngle);
        parentElement.append('path')
            .attr('d', describeArc(x, y, radius, startAngle, endAngle))
            .style('fill', circles[s].fill);

        sum += heightProportions[s] * 100;
    }
}