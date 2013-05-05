#######################
# INSTALLATION        #
#######################

Requires [jQuery](http://jquery.com) and [Raphaël](http://raphaeljs.com).

After loading storyflow.js and all of its prerequisites, you can initialize the widget with the following command:

    Storyflow.Widget({
      element: element,
      data: data,
      keys: keys
    });

Hereby, the three required parameters are defined as follows:

    // Specifies the id of the element where the Storyflow widget should be inserted. The element should be obviously present in the HTML code of the page where you are calling the widget.
    var element = '#storyflow-chart'; 
    
    // List of widget topics as strings. Note that the order will be important later. Optimized to work with up to four topics.
    var keys = ["Pernod Ricard", "Jameson Irish Whiskey", "Irish Distillers", "Absolut Vodka"];
    
    // List of data points in the widget, 
    var data = [
      {
        date: 1338505200000, // Article date as JS timestamp (in ms, not s!)
        title: "Whiskey galore for Tullamore", // Article title
        link: "http://www.myblog.com/news/2345", // Article URL
        score: 33, // Article popularity score (value range [0,100]).
        topicweights: [0.5230433333333335, 0.27259333333333335, 0.27598666666666694, 0] // Relative importance of topics from `keys` within the article, with the order corresponding to that of `keys`. Values should be within [0,1] range and there must be a value supplied for each key. Will also work nicely if your topics don't have fine-grained values and you set all weights to 1.
      },
      ... 
    ];


#######################
# OPTIONS             #
#######################

In addition to the three required parameters, there is a bunch of further options that can be used to configure different aspects of the widget. The following is a list of options along with their default values. These can be overridden by passing values for corresponding attributes with the `Widget()` call shown above. The options will allow you to adjust the widget's appearance in all sorts of ways, but none of them are actually required, so feel free override the ones you like and ignore the ones you're happy with.

    Widget.prototype.defaults = {
      pointSize: 5, // Radius of inactive data point, in px.
      pointSizeActive: 15, // Radius of active data point, in px.
      ringWidth: 3, // Width of the topic segments around an inactive item, in px.
      ringWidthActive: 5, // Minimum width of a topic segment around an active item, in px.
      ringWidthActivePlus: 35, // Maximum added width of a topic segment around an active item, in px. (Multiplied by topic weight.)
      gapSize: 2, // Width of gap between point and topic ring in an inactive item, in px.
      gapSizeActive: 4, // Width of gap between point and topic ring in an active item, in px.
      pointColor: '#aaa', // Colour of data point.
      lineColors: ['#d00012', '#31aad4', '#fcc637', '#be3d8f'], // Colours for the four topic rings.
      xmax: 'auto '+Date.now(), // Upper limit for the X-axis, defaults to now.
      xmin: 'auto '+(Date.now() - 365*24*60*60*1000), // Lower limit for the X-axis, defaults to one year ago.
      ymax: 'auto 100', // Upper limit for the Y-axis, defaults to 100.
      ymin: 'auto 0', // Lower limit for the Y-axis, defaults to 0.
      ysections: 4, // Number of sections to split the graph into horizontally.
      marginTop: 25, // Margin at the top of the graph, i.e. between graph and infobox, in px.
      marginRight: 0, // Margin on the right side of the graph, in px.
      marginBottom: 30, // Margin at the bottom of the graph, i.e. space for the X-axis labels, in px.
      marginLeft: 10, // Margin on the left side of the graph, i.e. space for the Y-axis labels, in px.
      yearBoxSize: 12, // Height of the year box at the bottom of the graph, in px.
      yearBoxValue: function(x) { return new Date(x).getFullYear(); }, // Date format for the labels inside the year box.
      yearBoxMarginTop: 2, // Margin at the top of the year box, i.e. space between the graph, in px.
      yearBoxMarginBottom: 0, // Margin at the bottom of the year box, in px.
      yearBoxLabelColor: '#fff', // Colour of the labels inside the year box.
      gridColor: '#aaa', // Colour of the grid inside the graph, and the year box fill.
      gridStrokeWidth: 0.5, // Width of the grid lines, in px.
      textColor: '#888', // Colour of the axis tick labels around the graph.
      textSize: 10, // Size of the axis tick labels, in px.
      drawXLabels: true, // Whether to draw labels for X-axis ticks.
      xLabelMargin: 5, // Minimum margin between X-axis labels, in px. (Will skip label(s) if not satisfied.) 
      xLabelUnit: 'month', // Time unit for determining X-axis tick allocation, distance and label format.
      xLabelFormat: function (x) { return x.getMonth() + 1; }, // Custom label format for X-axis ticks, overrides default format for the above unit.
      indicatorColor: '#555', // Signpost indicator colour.
      indicatorWidth: 1 // Signpost indicator line width, in px.
    };

If you think something else should be configurable, let us know and we'll try to do our best to add more configuration options for you to play with.
