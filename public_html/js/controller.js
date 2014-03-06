	// global topic graph map
	var topicGraphs = {};

$(document).ready(function () {
	// load the data
	var topics = [];



	//$.ajax({
	//	url: "http://treetm.jcchuang.org/nsf1k_mallet/vis/GroupInABox?format=json&termLimit=5",
	//	success: function (data) {
			var counter = 0;
			for (var topic in data.TopTermsPerTopic) {
				var nodes = [];
				var edges = [];
				$.each(data.TopTermsPerTopic[topic], function (index, term) {
					// TODO: I really don't like how this is being stored in the JSON... 
					for (var k in term) {
						nodes.push({"name":k, "value":term[k], "class":"existing"});
					}
				});
				// Determine the edges for each node
				// TODO: a better data structure may make this more efficient
				$.each(nodes, function (source, node) {
					$.each(data.TermCoFreqs[node.name], function (term, value) {
						if (value > 500 && term !== node.name) {
							$.each(nodes, function (target, node2) {
								if (term === node2.name) {
									edges.push({"source":source, "target":target, "value":value});
								}
							});
						}
					});
				})
				topics.push({"nodes":nodes, "edges":edges, "id":"topic" + counter, "name":"TOPIC " + counter});
				counter += 1;
			}
			$.each(topics, function (index, topic) {
				// Add a div to the html
				$("#topics").append($("<span></span>")
					.attr("class", "topic")
					.attr("id", topic.id)
					//.append("<span class='topic-cue'></span>")
					.append($("<span></span>")
						.attr("class", "topic-header")
						.append($("<span></span>")
							.html(topic.name)
							.attr("class", "topic-name")
						)
						.append($("<input>")
							.attr("type", "text")
							.attr("class", "topic-name-input")
							//.attr("placeholder", function () { return $(this).parent().find(".topic-name").text(); })
							.on("click", function () {
								return false;
							}) // click
							.keypress(function (event) {
								if (event.which === 13) {
									// If the user enters a new name, swap it for the topic name
									var val = $(this).val();
									if (val === "") {
										val = $(this).attr("placeholder");
									}
									$(this).parents(".topic-header").removeClass("selected").find(".topic-name").html(val);
								}
							}) // keypress
						 )
						.append($("<span></span>")
							.attr("class", "icon topic-edit icon-wrench active")
							.attr("title", "edit topic")
							.on("click", function () {
								// If the wrench is clicked, allow user to input a new name
								$(this).addClass("selected");
								var $header =  $(this).parents(".topic-header");
								var name = $header.addClass("edit").find(".topic-name").text();
								$header.find(".topic-name-input").attr("placeholder", name).focus();
							})
						)
						.append($("<span></span>")
							.attr("class", "topic-toolbox")
							// ADD WORD TO TOPIC
							.append($("<span></span>")
								.attr("class", "icon add-word icon-plus active")
								.attr("title", "add words to the topic")
								.on("click", function () {
									$(this).addClass("selected");
									$(this).parents(".topic").find(".topic-footer").addClass("add").find(".topic-word-input").focus();
								})
							)
							// REMOVE WORD FROM TOPIC
							.append($("<span></span>")
								.attr("class", "icon remove-word icon-scissors inactive")
								.attr("title", "remove word from topic")

							)
							// SPLIT TOPIC
							.append($("<span></span>")
								.attr("class", "icon topic-split icon-fork active")
								.attr("title", "split topic")
								.on("click", function () {
									$(this).addClass("selected");
									$(this).parents(".topic").find(".topic-footer").addClass("edit").find(".topic-edit-instructions").html("select the terms for the new topic").show();
								})
							)
							// LOCK TOPIC
							.append($("<span></span>")
								.attr("class", "icon topic-lock icon-unlocked active")
								.attr("title", "lock topic")
							)
						) // topic toolbox
					) // topic header
					.append($("<span></span>")
						.attr("class", "topic-footer")
						.append($("<input>")
							.attr("type", "text")
							.attr("class", "topic-word-input")
							.keypress(function (event) {
								if (event.which === 13) {
									// If the user enters a word, add it to the topic
									var word = $(this).val(),
									topic = $(this).parents(".topic").attr("id");
									addWord(word, topic);
									$(this).val("");
								}
							}) // keypress
						)						
						.append($("<span></span>")
							.attr("class","icon topic-edit-complete icon-checkmark active")
							.attr("title", "done")
							.on("click", function () {
								$(this).parents(".topic-footer").removeClass("edit").removeClass("add");
								var $header = $(this).parents(".topic").find(".topic-header");
								$header.find(".topic-split").removeClass("selected");
								$header.find(".add-word").removeClass("selected");
							}) // click
						)
						.append($("<span></span>")
							.attr("class", "topic-edit-instructions")
						)
					) // topic footer
				);
				// Render the topic
				topicGraphs[topic.id] = new graph(topic);
				//renderTopic(topic);
			});

		//},
		//failure: function (msg) {
		//	console.log("failure: " + msg);
		//}
	//});

		/*for (var term in topicmodeldata.TermCoFreqs) {
			if (topic.indexOf(term) !== -1) {
				for (var term2 in topicmodeldata.TermCoFreqs[term]) {
					if (term !== term2) {
											if (topic.indexOf(term2) !== -1) {
						// Add an edge
						edges.push({
							"source":topic.indexOf(term),
							"target":topic.indexOf(term2),
							"value":topicmodeldata.TermCoFreqs[term][term2]
						});
					}
					}

				}
			}
		}*/

		
	//});
});

function addWord(word, topic) {
	topicGraphs[topic].addNode({"name":word, "value":100, "class":"new"}); 
}




function renderTopic(topic) {
	var width = 225,
    height = 225;

	var color = d3.scale.category20();

	var k = Math.sqrt(topic.nodes.length / (width * height));
	var d = 2*topic.edges.length/(topic.nodes.length*(topic.nodes.length-1));

    var nodedrag = d3.behavior.drag()
        .on("dragstart", dragstart)
        .on("drag", dragmove)
        .on("dragend", dragend);

    function dragstart(d, i) {
      //  force.stop() // stops the force auto positioning before you start dragging
    }

    function dragmove(d, i) {
        d.px += d3.event.dx;
        d.py += d3.event.dy;
        d.x += d3.event.dx;
        d.y += d3.event.dy; 
        tick(); // this is the key to make it work together with updating both px,py,x,y on d !
    }

    function dragend(d, i) {
        d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
        tick();
       // force.resume();
    }


	//TODO: should the force directed layout take edge weight into account? 
	var force = d3.layout.force()
	    .charge(-10 / k)
    	.gravity(80 * k)
    	// a denser graph needs the nodes to be pushed further away
	    .linkDistance(Math.min(Math.max(50, 200*d), 200))
	    //.linkStrength(function (d) { return Math.min(d.value/1000, 1); })
	    .size([width, height]);

	var svg = d3.select("#" + topic.id).append("svg")
	    .attr("width", width)
	    .attr("height", height);
	console.log("height", height)

	
	  force
	      .nodes(topic.nodes)
	      .links(topic.edges)
	      .start();

	  var link = svg.selectAll(".link")
	       .data(topic.edges)
	       .enter().append("line")
	       .attr("class", "link");
	      // .style("stroke-width", function(d) { return Math.sqrt(d.value/100); });

	  	var node = svg.selectAll("g.node")
	      	.data(topic.nodes)
	        .enter().append("g")
			.attr("class", function(d) { return "node node__"+d.name })
			// Highlight all matching term nodes
			.on( "mouseover", function(d) { d3.selectAll("g.node__"+d.name).classed({"hovered":true}); })//.style("fill", "#2ECC71").style("stroke", "#2ECC71") })
			.on( "mouseout", function(d) { d3.selectAll("g.node__"+d.name).classed({"hovered":false}); })//.style("fill", null).style("stroke", null) })
			// Toggle Select
			.on( "click", function (d) { d3.select(this).classed({"selected": true}) });

		var circle = node.append("circle")
	    	.attr("class", "circle")
	    	.attr("r", function (d) { return Math.min(d.value/10, 40) + "px"; })
	    	.call(nodedrag);

		var label = node.append("text")
	    	.attr("class", "term")
	    	.text(function(d) { return d.name})
	    	.attr("text-anchor", "middle")
	    	.call(nodedrag);

	  node.append("title")
	      .text(function(d) { return d.name; });


		var n = 100;
		force.start();
  		for (var i = n * n; i > 0; --i) force.tick();
  		force.stop();

  	tick();

		function tick() {
				    link.attr("x1", function(d) { return d.source.x; })
			        .attr("y1", function(d) { return d.source.y; })
			        .attr("x2", function(d) { return d.target.x; })
			        .attr("y2", function(d) { return d.target.y; });

			    node.attr("transform", function(d) { 
		    		return 'translate(' + [d.x, d.y] + ')'; 
		  		});  
		}

	topicGraphs[topic] = svg;

	 // force.on("tick", tick); 
}