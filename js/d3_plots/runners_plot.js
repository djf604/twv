// https://stackoverflow.com/a/14426477
d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};


// console.log($('svg#runner-plot'));
// console.log($('svg#runner-plot').width());
// console.log($('div#runner-plot-wrapper').width());
// console.log($('div#runner-plot-wrapper').getHiddenDimensions());
var marginRunner = {top: 50, right: 50, bottom: 100, left: 130},
    widthRunner = 1000 - marginRunner.left - marginRunner.right,
    heightRunner = 600 - marginRunner.top - marginRunner.bottom;

var MIN_GOAL = 1024,
    MIN_FUNDRAISED = 4,
    MAX_GOAL = 50000;


var svgRunner = d3.select('svg#runner-plot')
    // .attr('width', widthRunner + marginRunner.left + marginRunner.right)
    .attr('width', '1000')
    .attr('height', heightRunner + marginRunner.top + marginRunner.bottom)
    .append('g').attr('transform', 'translate(' + marginRunner.left + ',' + marginRunner.top + ')');

// add the tooltip area to the webpage
// var tooltip = d3.select("body").append("div")
//     .attr("class", "tooltip")
//     .style("opacity", 0);

// setup fill color
// var cValue = function(d) { return d.Manufacturer;},
//     color = d3.scaleOrdinal(d3.schemeCategory10);

function updateRunners(data) {
    var points = svgRunner.selectAll('.dot').data(data, function(d) {return d.id_});

    // For new data points
    points.enter().append('circle')
        .attr('class', 'dot dot-inactive')
        .attr('r', 9)
        .attr('cx', xMap)
        .attr('cy', yMap)
        .on('mouseover', function(d) {
            var runnerPath = [];
            d3.selectAll('.dot').each(function(pt) {
                if (pt.id === d.id) {
                    runnerPath.push([xScaleRunner(pt.goal), yScale(pt.fundraised)]);
                    d3.select(this).attr('class', 'dot dot-highlight').moveToFront();
                } else {
                    d3.select(this).attr('class', 'dot dot-inactive');
                }
            });
            var context = d3.path();
            context.moveTo(runnerPath[0][0], runnerPath[0][1]);
            for (var i = 1; i < runnerPath.length; i++) {
                context.lineTo(runnerPath[i][0], runnerPath[i][1]);
            }
            d3.selectAll('path.runner-line').remove();
            svgRunner.append('path')
                .attr('class', 'runner-line')
                .attr('d', context.toString());

            document.getElementById('goal-total').innerText = ' | Goal: $' + d.goal;
            document.getElementById('fundraised-total').innerText = ' Fundraised: $' + d.fundraised;
        });

    points.exit().remove();
}

var runnerData, xValue, xScaleRunner, xMap, xAxis, yValue, yScale, yMap, yAxis;
d3.csv('data/chicago_marathon_runners.withid.csv', function(d) {
    var goal = +d.PARTICIPANTFUNDRAISINGGOAL,
        fundraised = +d.PARTICIPANTSUMDONATIONS,
        id = d.PARTICIPANTCONSTITUENTID;
    if (goal >= MIN_GOAL
        && goal <= MAX_GOAL
        && fundraised >= MIN_FUNDRAISED
    )
        return {
            id_: d.id,
            id: id,
            fundraised: fundraised,
            goal: goal,
            metGoal: fundraised >= goal,
            gender: d.GENDER,
            newRunner: d.EXPERIENCEDORNEW === 'new' || d.EXPERIENCEDORNEW === 'experiencedfirsttime',
            teamCaptain: d.PARTICIPANTTYPE === 'Team Captain - Full Marathon'
        }
}).then(function(data) {
    runnerData = data;
    var maxFundraised = d3.max(data, function(d) {return d.fundraised});


    xValue = function(d) { return d.goal;}; // data -> value
    xScaleRunner = d3.scaleLog().range([0, widthRunner]).domain([MIN_GOAL, MAX_GOAL]).base(2); // value -> display
    xMap = function(d) { return xScaleRunner(xValue(d));}; // data -> display
    xAxis = d3.axisBottom(xScaleRunner).tickFormat(function(d) {return '$' + d.toLocaleString()});

    // setup y
    yValue = function(d) { return d.fundraised;}; // data -> value
    yScale = d3.scaleLog().range([heightRunner, 0]).base(2).domain([MIN_FUNDRAISED, maxFundraised]); // value -> display
    yMap = function(d) { return yScale(yValue(d));}; // data -> display
    yAxis = d3.axisLeft(yScale).tickFormat(function(d) {return '$' + d.toLocaleString()});

    // Draw x-axis
    svgRunner.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + heightRunner + ")")
        .style('font-size', '16px')
        .call(xAxis);

    // Draw y-axis
    svgRunner.append("g")
        .attr("class", "y axis")
        .style('font-size', '16px')
        .call(yAxis);

    // Draw axis labels
    svgRunner.append('text')
        .attr('transform', 'translate(' + (widthRunner / 2) + ', ' + (heightRunner + 60) + ')')
        .style('font-size', '24px')
        .style('stroke', 'white').style('fill', 'white')
        .style('text-anchor', 'middle')
        .text('Fundraising Goal in US Dollars (log2)'); // x-axis label
    svgRunner.append('text')
        .attr('transform', 'translate(-90, ' + (heightRunner / 2) + ') rotate(-90)')
        .style('font-size', '24px')
        .style('stroke', 'white').style('fill', 'white')
        .style('text-anchor', 'middle')
        .text('Total Funds Raised in US Dollars (log2)'); // y-axis label



    // Draw data points
    updateRunners(data);

    svgRunner.append('line')
        .attr('x1', xScaleRunner(d3.max([MIN_GOAL, MIN_FUNDRAISED])))
        .attr('y1', yScale(d3.max([MIN_GOAL, MIN_FUNDRAISED])))
        .attr('x2', xScaleRunner(d3.min([MAX_GOAL, maxFundraised])))
        .attr('y2', yScale(d3.min([MAX_GOAL, maxFundraised])))
        .style('stroke', '#F37022')
        .style('stroke-width', '3px');
});


$('#runner-plot-filter').change(function() {
    var val = $(this).val(), newData;
    if (val === 'all') {
        newData = runnerData;
    } else if (val === 'goal_met') {
        newData = runnerData.filter(function(v) {return v.metGoal});
    } else if (val === 'new_runner') {
        newData = runnerData.filter(function(v) {return v.newRunner});
    } else if (val === 'returning_runners') {
        newData = runnerData.filter(function(v) {return !v.newRunner});
    } else if (val === 'male_runners') {
        newData = runnerData.filter(function(v) {return v.gender === 'male'});
    } else if (val === 'female_runners') {
        newData = runnerData.filter(function(v) {return v.gender === 'female'});
    } else if (val === 'team_captains') {
        newData = runnerData.filter(function(v) {return v.teamCaptain});
    }

    // Update plot
    updateRunners(newData);
    d3.selectAll('path.runner-line').remove();
    $('#runners-total').text(newData.length);
    $('#goal-total').text('');
    $('#fundraised-total').text('');
});