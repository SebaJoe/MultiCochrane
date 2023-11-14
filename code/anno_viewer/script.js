window.onload = function () {

  var file_content = "";

  var alignment_list = [];
  var dict1 = [];
  var dict2 = [];
  var article_list = [];

  var article_names = [];

  var current_article;

  var current_tab = "#original";
 
  var left_id = "NONE";

  var right_id = "NONE";

  var switched = false;

  var multi_select = false;

  var method_list = [];

  $(".anno-input").prop("disabled", true);
  $("#save-button").prop("disabled", true);

  $("#myfile").change(function () {
    var myFile = $("#myfile").prop('files')[0];
    
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      
      file_content = reader.result;
      load();
    }, false);

    if (myFile) {
      reader.readAsText(myFile);
    }
    
  });

  function load() {
    
    var lines = file_content.split("\n");

    var head = lines.shift();

    //check if alignment file is old or new

    var anno_tags = head.split("|").slice(7);

    var new_type = false;

    if (anno_tags.slice(0, 4).join() === ['ins', 'del', 'sub', 'ela'].join()) {
      if (anno_tags.length >= 6 && anno_tags.slice(4, 6).join() === ['conr', 'conids'].join()) {
        new_type = true;
        method_list = head.split("|").slice(13);
      } else {
        method_list = head.split("|").slice(11);
      }
    } else {
      alert("Sorry! Alignment file is not formatted correctly.");
      return;
    }



    lines.pop();

    for (var i = 0; i < method_list.length; i++) {
      $("#tab-con").append(
        $("<li class='nav-item' id=\""+ method_list[i] +"\"><a class='nav-link'>"+ method_list[i] +"</a></li>")
      );
    }

    //first create the alignment list
    

    for (var i = 0; i < lines.length; i++) {
     var line = lines[i];
      
     var split_line = line.split("|");

     var alignment = {
       pair_ID: split_line[0],
       article_name: line.split("-")[1],
       pair_UID: split_line[1],
       complex_id: split_line[2],
       complex: split_line[3],
       simple_id: split_line[4],
       simple: split_line[5],
       alignment: parseInt(split_line[6]),
       ins: parseInt(split_line[7]),
       del: parseInt(split_line[8]),
       sub: parseInt(split_line[9]),
       ela: parseInt(split_line[10]),
       con_r: new_type ? parseInt(split_line[11]): 0,
       con_ids: new_type ? split_line[12]: "NONE",
       //TODO: turn to list
       //SB: parseFloat(split_line[11]),
       //tf: parseFloat(split_line[12]),
       //jac: parseFloat(split_line[13])
     };

      var boundary = new_type ? 13 : 11;

      for (var j = 0; j < method_list.length; j++) {
        alignment[method_list[j]] = parseFloat(split_line[boundary + j]);
      }

     alignment_list.push(alignment);

    }

    //now create a list of article names


    for (var i = 0; i < alignment_list.length; i++) {
      var art_name = alignment_list[i].article_name;
      if (!article_names.includes(art_name)) {
        article_names.push(art_name);
      }
    }


    //add the names to the select element

    article_names.forEach(function (name) {
      $("#article_list").append(
        $("<option value=\"" + name + "\">" + name + "</option>")
      );
    });

    //create the articles array

    for(var i = 0; i < article_names.length; i++) {
      var art_name = article_names[i];
      var complex = [];
      var complex_ids = [];
      var simple = [];
      var simple_ids = [];
      dict1.push({});
      dict2.push({});
      for (var j = 0; j < alignment_list.length; j++) {
        var alignment = alignment_list[j];
        if (art_name === alignment.article_name && !complex_ids.includes(alignment.complex_id)) {
          var sent_in_para_idx = parseInt(alignment.complex_id.split("-")[3]);
          complex.push([alignment.complex, complex.length, sent_in_para_idx]);
          complex_ids.push(alignment.complex_id);
        }
        if (art_name === alignment.article_name && !simple_ids.includes(alignment.simple_id)) {
          var sent_in_para_idx = parseInt(alignment.simple_id.split("-")[3]);
          simple.push([alignment.simple, simple.length, sent_in_para_idx]);
          simple_ids.push(alignment.simple_id);
        }
        if (art_name === alignment.article_name) {
          if (!(alignment.complex in dict1[i])) {
            dict1[i][alignment.complex] = {a_list: [j]};
          } else {
            dict1[i][alignment.complex].a_list.push(j);
          }
          if (!(alignment.simple in dict2[i])) {
            dict2[i][alignment.simple] = {a_list: [j]};
          } else {
            dict2[i][alignment.simple].a_list.push(j);
          }
        }
      }
      var article_obj = {
        simple_doc: simple,
        complex_doc: complex
      };

      article_list.push(article_obj);
    }

    //now to store alignments and orders 

    for (var i = 0; i < dict1.length; i++) {
      //TODO store the orders for variable number of measures
      for (let key in dict1[i]) {
        var jac_sort = [];
        var sb_sort = [];
        var or_sort = [];
        var tf_sort = [];
        var align = [];
        for (var j = 0; j < dict1[i][key].a_list.length; j++) {
          or_sort.push(j);
          align.push(j);
        }
        dict1[i][key].aligned = align.filter(function(idx) {
          var idx_idx = dict1[i][key].a_list[idx];
          return alignment_list[idx_idx].alignment === 1 || alignment_list[idx_idx].alignment === 2;
        });

        if (alignment_list[dict1[i][key].a_list[0]].alignment === 0) {
          dict1[i][key].aligned = "null";
        }
        
        for (var j = 0; j < method_list.length; j++) {
          var sort = [];
          for (var k = 0; k < dict1[i][key].a_list.length; k++) {
            sort.push(k);
          }
          sort.sort(function(a, b) {
            var a_idx = dict1[i][key].a_list[a];
            var b_idx = dict1[i][key].a_list[b];
            return alignment_list[b_idx][method_list[j]] - alignment_list[a_idx][method_list[j]];
          });
          dict1[i][key][method_list[j]+"_sort"] = sort;
        }
        dict1[i][key].or_sort = or_sort;
      }
    }

    
    for (var i = 0; i < dict2.length; i++) {
      //TODO store the orders for variable number of measures
      for (let key in dict2[i]) {
        var jac_sort = [];
        var sb_sort = [];
        var or_sort = [];
        var tf_sort = [];
        var align = [];
        for (var j = 0; j < dict2[i][key].a_list.length; j++) {
          or_sort.push(j);
          align.push(j);
        }
        dict2[i][key].aligned = align.filter(function(idx) {
          var idx_idx = dict2[i][key].a_list[idx];
          return alignment_list[idx_idx].alignment === 1 || alignment_list[idx_idx].alignment === 2;
        });

        if (alignment_list[dict2[i][key].a_list[0]].alignment === 0) {
          dict2[i][key].aligned = "null";
        }
        
        for (var j = 0; j < method_list.length; j++) {
          var sort = [];
          for (var k = 0; k < dict2[i][key].a_list.length; k++) {
            sort.push(k);
          }
          sort.sort(function(a, b) {
            var a_idx = dict2[i][key].a_list[a];
            var b_idx = dict2[i][key].a_list[b];
            return alignment_list[b_idx][method_list[j]] - alignment_list[a_idx][method_list[j]];
          });
          dict2[i][key][method_list[j]+"_sort"] = sort;
        }
        dict2[i][key].or_sort = or_sort;
      }
    }



    //load the first article

    load_article(0);
    
  }


  //event handler for left-hand side
  $(document).on("click", ".left-row", function (e) {
    var cur_id = $(this).attr("id");
    if (cur_id === left_id) {
      multi_select = false;
      $(".text-row").css("background-color", "");
      change_order(cur_id, "or");
      left_id = "NONE";
      $("#ins").val("");
      $("#del").val("");
      $("#sub").val("");
      $("#elab").val("");
      $("#context").val("");
      $("#con-ids").val("");
      right_id = "NONE";
      $(".anno-input").prop("disabled", true);
      $("#save-button").prop("disabled", true);
    } else {
      if (e.shiftKey) {
        multi_select = true;
      } else 
        multi_select = false;
      left_id = cur_id;
      left_highlight(cur_id);
    }
  });
  
    $(document).on("click", ".right-row", function (e) {
    if (left_id === "NONE")
      return;
    var cur_id = $(this).attr("id");

    if (cur_id === right_id) {
      multi_select = false;
      $(".text-row").css("background-color", "");
      left_highlight(left_id);
      right_id = "NONE";
      $(".anno-input").prop("disabled", true);
      $("#save-button").prop("disabled", true);
    } else {
      if (e.shiftKey && cur_id !== "null-row") {
        multi_select = true;
      } else 
        multi_select = false;
      right_id = cur_id;
      right_highlight(cur_id);
    }
  });
  

  $("#switch-button").click(function () {
    var temp = dict1;
    dict1 = dict2;
    dict2 = temp;
    var temp_color = $("#left-side").css("background-color");
    $("#left-side").css("background-color", $("#right-side").css("background-color"));
    $("#right-side").css("background-color", temp_color);

    var left_t = $("#left-tag").text();
    $("#left-tag").text($("#right-tag").text());
    $("#right-tag").text(left_t);

    switched = !switched;

    load_article(current_article);

    if (switched) {
      var num_temp = $(".left-lnum").css("color");
      $(".left-lnum").css("color", $(".right-lnum").css("color"));
      $(".right-lnum").css("color", num_temp);
    }
  });

  //event handlers for changing articles
  $("#article_list").change(function () {
    var art_idx = article_names.indexOf($("#article_list option:selected").text());
    
    load_article(art_idx);
  });

  $(".art-button").click(function () {
    if ($(this).attr("id") === "left-article") {
      load_article(current_article - 1);
    } else {
      load_article(current_article + 1);
    }
  });


  $("#sort-check").change(function() {
    if (left_id !== "NONE" && current_tab !== "#original") {
      change_order(left_id, current_tab.substring(1));
    }
  });

  function clear_null(art_idx, left_text, left_idx) {
    for (var i = 0; i < dict1[art_idx][left_text].a_list.length; i++) {
      alignment_list[dict1[art_idx][left_text].a_list[i]].ins = 0;
      alignment_list[dict1[art_idx][left_text].a_list[i]].del = 0;
      alignment_list[dict1[art_idx][left_text].a_list[i]].sub = 0;
      alignment_list[dict1[art_idx][left_text].a_list[i]].ela = 0;
      alignment_list[dict1[art_idx][left_text].a_list[i]].con_r = 0;
      alignment_list[dict1[art_idx][left_text].a_list[i]].con_ids = 0;
      
      alignment_list[dict1[art_idx][left_text].a_list[i]].alignment = 3;
    }
  }

  $("#save-button").click(function () {
     if (left_id !== "NONE" && right_id !== "NONE") {
       //save in both dict1 and dict2
       //also save in alignment_list
       var art_idx = parseInt(left_id.split("-")[1]);

       //TODO: SWITCH

       console.log("multi_select " + multi_select);

       if(right_id === "null-row") {
         var left_text = $("#" + left_id + " > .line").text();
         var left_idx = parseInt(left_id.split("-")[2]);

         //alignment_list[dict1[art_idx][left_text].a_list[right_idx]].alignment = 1;

         dict1[art_idx][left_text].aligned = "null";

         for (var i = 0; i < dict1[art_idx][left_text].a_list.length; i++) {
           if (alignment_list[dict1[art_idx][left_text].a_list[i]].alignment === 1 || 
           alignment_list[dict1[art_idx][left_text].a_list[i]].alignment === 2) {
             var right_text = $("#right-" + art_idx  + "-" + i + " > .line").text();
             console.log(right_text);
             dict2[art_idx][right_text].aligned.splice(dict2[art_idx][right_text].aligned.indexOf(left_idx), 1);
           }
           
           alignment_list[dict1[art_idx][left_text].a_list[i]].ins = $("#ins").val();
           alignment_list[dict1[art_idx][left_text].a_list[i]].del = $("#del").val();
           alignment_list[dict1[art_idx][left_text].a_list[i]].sub = $("#sub").val();
           alignment_list[dict1[art_idx][left_text].a_list[i]].ela = $("#elab").val();
           alignment_list[dict1[art_idx][left_text].a_list[i]].con_r = $("#context").val();
           alignment_list[dict1[art_idx][left_text].a_list[i]].con_ids = $("#con-ids").val();
           
           alignment_list[dict1[art_idx][left_text].a_list[i]].alignment = 0;
         }
         

       } else if (multi_select) {


         var left_rows = $(".left-row").filter(function () {
           var color = $(this).css("background-color");
           return color === "#FFFF00" || color === "rgb(255, 255, 0)";
         });

         
         var right_rows = $(".right-row").filter(function () {
           var color = $(this).css("background-color");
           console.log(color);
           return color === "#FFA500" || color === "rgb(255, 165, 0)";
         }); 

         console.log(left_rows);
         console.log(right_rows);

         for (var i = 0; i < left_rows.length; i++) {
           for (var j = 0; j < right_rows.length; j++) {
             console.log(left_rows[i]);
             var l_id = $(left_rows[i]).attr("id");
             var r_id = $(right_rows[j]).attr("id");
             console.log(l_id);
             console.log(r_id);
             save_pair(l_id, r_id);
           }
         }

       } else {


         var left_text = $("#" + left_id + " > .line").text();
         var right_text = $("#" + right_id + " > .line").text();
         var left_idx = parseInt(left_id.split("-")[2]);
         var right_idx = parseInt(right_id.split("-")[2]);

         if (dict1[art_idx][left_text].aligned.indexOf(right_idx) === -1) {
           if (dict1[art_idx][left_text].aligned === "null") {
             clear_null(art_idx, left_text, left_idx);
             dict1[art_idx][left_text].aligned = [];
           }
           dict1[art_idx][left_text].aligned.push(right_idx);
         }
         if (dict2[art_idx][right_text].aligned.indexOf(left_idx) === -1) {
           if (dict2[art_idx][right_text].aligned === "null") {
             clear_null(art_idx, left_text, left_idx);
             dict2[art_idx][right_text].aligned = [];
           }
           dict2[art_idx][right_text].aligned.push(left_idx);
         }
         
         alignment_list[dict1[art_idx][left_text].a_list[right_idx]].ins = $("#ins").val();
         alignment_list[dict1[art_idx][left_text].a_list[right_idx]].del = $("#del").val();
         alignment_list[dict1[art_idx][left_text].a_list[right_idx]].sub = $("#sub").val();
         alignment_list[dict1[art_idx][left_text].a_list[right_idx]].ela = $("#elab").val();
         alignment_list[dict1[art_idx][left_text].a_list[right_idx]].con_r = $("#context").val();
         alignment_list[dict1[art_idx][left_text].a_list[right_idx]].con_ids = $("#con-ids").val();

         alignment_list[dict1[art_idx][left_text].a_list[right_idx]].alignment = 1;
         
       }

       multi_select = false;

       $(".text-row").css("background-color", "");
       right_id = "NONE";
       $(".anno-input").prop("disabled", true);
       $("#save-button").prop("disabled", true);
       left_highlight(left_id);
     }
  });


  function save_pair(left, right) {

    var art_idx = parseInt(left.split("-")[1]);

    var left_text = $("#" + left + " > .line").text();
    var right_text = $("#" + right + " > .line").text();
    var left_idx = parseInt(left.split("-")[2]);
    var right_idx = parseInt(right.split("-")[2]);

    if (dict1[art_idx][left_text].aligned.indexOf(right_idx) === -1) {
      if (dict1[art_idx][left_text].aligned === "null") {
        dict1[art_idx][left_text].aligned = [];
      }
      dict1[art_idx][left_text].aligned.push(right_idx);
    }
    if (dict2[art_idx][right_text].aligned.indexOf(left_idx) === -1) {
      if (dict2[art_idx][right_text].aligned === "null") {
        dict2[art_idx][right_text].aligned = [];
      }
      dict2[art_idx][right_text].aligned.push(left_idx);
    }
    
    alignment_list[dict1[art_idx][left_text].a_list[right_idx]].ins = $("#ins").val();
    alignment_list[dict1[art_idx][left_text].a_list[right_idx]].del = $("#del").val();
    alignment_list[dict1[art_idx][left_text].a_list[right_idx]].sub = $("#sub").val();
    alignment_list[dict1[art_idx][left_text].a_list[right_idx]].ela = $("#elab").val();
    alignment_list[dict1[art_idx][left_text].a_list[right_idx]].con_r = $("#context").val();
    alignment_list[dict1[art_idx][left_text].a_list[right_idx]].con_ids = $("#con-ids").val();

    alignment_list[dict1[art_idx][left_text].a_list[right_idx]].alignment = 1;
    

  }

  $(document).on("dblclick", ".right-row", function () {
    var bg_color = $(this).css("background-color");
    if (bg_color === "#FFFF00" || bg_color === "rgb(255, 255, 0)") {
      var r_id = $(this).attr("id");

      //TODO: SWITCH

      if (r_id === "null-row") {

        var art_idx = parseInt(left_id.split("-")[1]);
        
        var left_text = $("#" + left_id + " > .line").text();
        var left_idx = parseInt(left_id.split("-")[2]);
        
        dict1[art_idx][left_text].aligned = [];

        //alignment_list[dict1[art_idx][left_text].a_list[right_idx]].alignment = 1;
        for (var i = 0; i < dict1[art_idx][left_text].a_list.length; i++) {

          alignment_list[dict1[art_idx][left_text].a_list[i]].ins = 0;
          alignment_list[dict1[art_idx][left_text].a_list[i]].del = 0;
          alignment_list[dict1[art_idx][left_text].a_list[i]].sub = 0;
          alignment_list[dict1[art_idx][left_text].a_list[i]].ela = 0;
          alignment_list[dict1[art_idx][left_text].a_list[i]].con_r = 0;
          alignment_list[dict1[art_idx][left_text].a_list[i]].con_ids = "NONE";
          
          alignment_list[dict1[art_idx][left_text].a_list[i]].alignment = 3;

        }

      } else {
        
        var art_idx = parseInt(left_id.split("-")[1]);
        var left_text = $("#" + left_id + " > .line").text();
        var right_text = $("#" + r_id + " > .line").text();
        var left_idx = parseInt(left_id.split("-")[2]);
        var right_idx = parseInt(r_id.split("-")[2]);

        dict1[art_idx][left_text].aligned.splice(dict1[art_idx][left_text].aligned.indexOf(right_idx), 1);
        dict2[art_idx][right_text].aligned.splice(dict2[art_idx][right_text].aligned.indexOf(left_idx), 1);
        
        alignment_list[dict1[art_idx][left_text].a_list[right_idx]].ins = 0;
        alignment_list[dict1[art_idx][left_text].a_list[right_idx]].del = 0;
        alignment_list[dict1[art_idx][left_text].a_list[right_idx]].sub = 0;
        alignment_list[dict1[art_idx][left_text].a_list[right_idx]].ela = 0;
        alignment_list[dict1[art_idx][left_text].a_list[right_idx]].con_r = 0;
        alignment_list[dict1[art_idx][left_text].a_list[right_idx]].con_ids = "NONE";
        
        
        alignment_list[dict1[art_idx][left_text].a_list[right_idx]].alignment = 3;

      }

      $(".text-row").css("background-color", "");
      left_highlight(left_id);
      right_id = "NONE";
      $(".anno-input").prop("disabled", true);
      $("#save-button").prop("disabled", true);
    }
  });

  $("#download-btn").click(function () {
    var header = "pair_ID|pair_UID|sent_0_idx|sent_0|sent_1_idx|sent_1|aligning_method|ins|del|sub|ela|conr|conids";
    
    for (var i = 0; i < method_list.length; i++) {
      header += "|" + method_list[i];
    }

    header += "\n";

    var csv = header;
    
    for (var i = 0; i < alignment_list.length; i++) {
      var a = alignment_list[i];
      csv += a.pair_ID + "|" + a.pair_UID + "|" + a.complex_id + "|" + a.complex + "|"
                + a.simple_id + "|" + a.simple + "|" + a.alignment + "|" + a.ins + "|" + a.del
                + "|" + a.sub + "|" + a.ela + "|" + a.con_r + "|" + a.con_ids;
      for (var j = 0; j < method_list.length; j++) {
        csv += "|" + a[method_list[j]];
      }
      csv += "\n";
    }

    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

    var today = new Date();
    var filename = today.getFullYear()+'_'+(today.getMonth()+1)+'_'+today.getDate()+"_"+today.getHours() + "_" + today.getMinutes() + "_" + today.getSeconds();

    var link = document.createElement("a");
    if (link.download !== undefined) { // feature detection
      // Browsers that support HTML5 download attribute
      var url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
  });

  $(document).keydown(function (event) {
    if (left_id === "NONE") {
      return; 
    }
    var split = left_id.split("-");
    var id = parseInt(split[2]);
    if (event.which === 38 && id > 0) {
      split[2] = (id - 1) + "";
      $("#" + split.join("-")).trigger('click');
    } else if (event.which === 40 && id < $(".left-row").length - 1) {
      split[2] = (id + 1) + "";
      $("#" + split.join("-")).trigger('click');
    }
    
  });


  $(document).on("click", ".nav-item", function (e) {
    var cur_id = $(this).attr("id");
    if (e.shiftKey && current_tab !== "#" + cur_id && current_tab !== "#original" && cur_id !== "original") {
      $("#" + cur_id + " > a").addClass("active");
      current_tab += " #" + cur_id;
      if (left_id !== "NONE") {
        change_order(left_id, "multi");
      }
    } else if (current_tab !== "#" + cur_id) {
      $(".nav-item > a").removeClass("active");
      $("#" + cur_id + " > a").addClass("active");
      current_tab = "#" + cur_id;
      if (left_id !== "NONE") {
        if(current_tab === "#original") 
          change_order(left_id, "or");
        else
          change_order(left_id, cur_id);
      }
    }
  }); 
  
  function right_highlight(id) {

    if (!multi_select) {
      $("#ins").val("");
      $("#del").val("");
      $("#sub").val("");
      $("#elab").val("");
      $("#context").val("");
      $("#con-ids").val("");
      
      $(".text-row").css("background-color", "");
    }

    left_highlight(left_id);
    
    $("#" + id).css("background-color", "orange");
    
    if (id !== "null-row") {
      var art_idx = parseInt(id.split("-")[1]);
      var text = $("#" + left_id + " > .line").text();
      var right_idx = parseInt(id.split("-")[2]);


      var ins = alignment_list[dict1[art_idx][text].a_list[right_idx]].ins;
      var del = alignment_list[dict1[art_idx][text].a_list[right_idx]].del;
      var sub = alignment_list[dict1[art_idx][text].a_list[right_idx]].sub;
      var elab = alignment_list[dict1[art_idx][text].a_list[right_idx]].ela;
      var con_r = alignment_list[dict1[art_idx][text].a_list[right_idx]].con_r;
      var con_ids = alignment_list[dict1[art_idx][text].a_list[right_idx]].con_ids;
      
      $("#ins").val(ins);
      $("#del").val(del);
      $("#sub").val(sub);
      $("#elab").val(elab);
      $("#context").val(con_r);
      $("#con-ids").val(con_ids);
      
    } else {


      var art_idx = parseInt(left_id.split("-")[1]);
      var text = $("#" + left_id + " > .line").text();

      if (alignment_list[dict1[art_idx][text].a_list[0]].alignment !== 0) {
        
        $("#ins").val(0);
        $("#del").val(0);
        $("#sub").val(0);
        $("#elab").val(0);
        $("#context").val(0);
        $("#con-ids").val("NONE");
        
      } else {
        var ins = alignment_list[dict1[art_idx][text].a_list[0]].ins;
        var del = alignment_list[dict1[art_idx][text].a_list[0]].del;
        var sub = alignment_list[dict1[art_idx][text].a_list[0]].sub;
        var elab = alignment_list[dict1[art_idx][text].a_list[0]].ela;
        var con_r = alignment_list[dict1[art_idx][text].a_list[0]].con_r;
        var con_ids = alignment_list[dict1[art_idx][text].a_list[0]].con_ids;
        $("#ins").val(ins);
        $("#del").val(del);
        $("#sub").val(sub);
        $("#elab").val(elab);
        $("#context").val(con_r);
        $("#con-ids").val(con_ids);
      }

    }
    
    $(".anno-input").prop("disabled", false);

    $("#save-button").prop("disabled", false);
    
    $("#ins").focus();

  }
  
  function left_highlight(id) {
    if (!multi_select) {
      $("#ins").val("");
      $("#del").val("");
      $("#sub").val("");
      $("#elab").val("");
      $("#context").val("");
      $("#con-ids").val("");
      $(".text-row").css("background-color", "");
    }
      
    
    $("#" + id).css("background-color", "yellow");

    var art_idx = parseInt(id.split("-")[1]);
    var text = $("#" + id + " > .line").text();
    var alignments = dict1[art_idx][text].aligned;
    
    if (alignments === "null") {
      
      $("#null-row").css("background-color", "yellow");

      var ins = alignment_list[dict1[art_idx][text].a_list[0]].ins;
      var del = alignment_list[dict1[art_idx][text].a_list[0]].del;
      var sub = alignment_list[dict1[art_idx][text].a_list[0]].sub;
      var elab = alignment_list[dict1[art_idx][text].a_list[0]].ela;
      var con_r = alignment_list[dict1[art_idx][text].a_list[0]].con_r;
      var con_ids = alignment_list[dict1[art_idx][text].a_list[0]].con_ids;
      $("#ins").val(ins);
      $("#del").val(del);
      $("#sub").val(sub);
      $("#elab").val(elab);
      $("#context").val(con_r);
      $("#con-ids").val(con_ids);

    } else {


      for (var i = 0; i < alignments.length; i++) {
        var idx = alignments[i];
        $("#right-" + art_idx + "-" + idx).css("background-color", "yellow");
      }
      if (alignments.length === 1) {
        var ins = alignment_list[dict1[art_idx][text].a_list[alignments[0]]].ins;
        var del = alignment_list[dict1[art_idx][text].a_list[alignments[0]]].del;
        var sub = alignment_list[dict1[art_idx][text].a_list[alignments[0]]].sub;
        var elab = alignment_list[dict1[art_idx][text].a_list[alignments[0]]].ela;
        var con_r = alignment_list[dict1[art_idx][text].a_list[alignments[0]]].con_r;
        var con_ids = alignment_list[dict1[art_idx][text].a_list[alignments[0]]].con_ids;
        $("#ins").val(ins);
        $("#del").val(del);
        $("#sub").val(sub);
        $("#elab").val(elab);
        $("#context").val(con_r);
        $("#con-ids").val(con_ids);
      } 

    }
    

    if (current_tab !== "#original") {
      change_order(id, current_tab.substring(1));
    }
  }



  function change_order (id, type) {
    $('.rank').remove();
    var art_idx = parseInt(id.split("-")[1]);
    var text = $("#" + id + " > .line").text();
    var order_list = dict1[art_idx][text][type + "_sort"];
    if (current_tab.indexOf(" ") !== -1) {
      var tabs = current_tab.split(" ");
      var score_list = [];
      var idx_list = [];
      var cur_alist = dict1[art_idx][text].a_list;
      for (var i = 0; i < cur_alist.length; i++) {
        var combined_score = 0;
        for (var j = 0; j < tabs.length; j++) {
          var tab = tabs[j];
          var tab_atype = tab.substring(1);
          combined_score += alignment_list[cur_alist[i]][tab_atype];
        }
        score_list.push(combined_score);
        idx_list.push(i);
      }
      idx_list.sort(function(a, b) {
        return score_list[b] - score_list[a];
      });
      order_list = idx_list;
    }
    var or_list = dict1[art_idx][text]["or_sort"];

    var checked = $("#sort-check").prop("checked");
    

    

    for (var i = 1; i < order_list.length; i++) {
      if (checked) {
        var idx = order_list[i];
        var ele = "";
        if ($("#right-" + art_idx + "-" + idx).prev().hasClass("breaks")) {
          ele = $("#right-" + art_idx + "-" + idx).prev();
        } 
        $("#right-" + art_idx + "-" + idx).insertAfter("#right-" + art_idx + "-" + (order_list[i - 1]));
        if (ele !== "") ele.insertAfter("#right-" + art_idx + "-" + (order_list[i - 1]));
      } else {
        var idx = or_list[i];
        var ele = "";
        if ($("#right-" + art_idx + "-" + idx).prev().hasClass("breaks")) {
          ele = $("#right-" + art_idx + "-" + idx).prev();
        } 
        $("#right-" + art_idx + "-" + idx).insertAfter("#right-" + art_idx + "-" + (or_list[i - 1]));
        if (ele !== "") ele.insertAfter("#right-" + art_idx + "-" + (or_list[i - 1]));
      }
    }
    var rank_bgcolors = ["#9a6cf0", "#9a6cd5", "#9a6cc7", "#9a6cb5", "#9a6ca3"];
    if (current_tab !== "#original") {
      for (var i = 0; i < 5; i++) {
        var idx = order_list[i];
        var ele = $("<div class=\"col rank col-sm-1\">" + (i + 1) + "</div>");
        ele.css("background-color", rank_bgcolors[i]);
        ele.css("color", "#FFFFFF");
        $("#right-" + art_idx + "-" + idx).append(ele);
      }
    }
  }


  function load_article(index) {
    

    $("div").remove(".text-row");
    $(".breaks").remove();

    left_id = "NONE";

    right_id = "NONE";
    
    $(".art-button").show();

    if(index === 0) {
      $("#left-article").hide();
    } else if (index === article_names.length - 1) {
      $("#right-article").hide();
    } 

    current_article = index;
    


    var article = article_list[index];
    var doc1 = article.complex_doc;
    var doc2 = article.simple_doc;

    if (switched) {
      var temp = doc1;
      doc1 = doc2;
      doc2 = temp;
    }

    $("#article_name").text(article_names[index]);
    for (var i = 0; i < doc1.length; i++) {
      var ele = $("<div class=\"row text-row left-row\"><div class=\"col line\">"+ doc1[i][0] +"</div><div class=\"col left-lnum col-sm-1\">" + doc1[i][1] + "</div></div>");
      ele.attr("id", "left-" + index + "-" + i);
      if (doc1[i][2] === 0 && i != 0) {
        $("#left-toadd").append("<br class='breaks'>");
        $("#left-toadd").append(ele);
      } else {
        $("#left-toadd").append(ele);
      }
    }

    var ele = $("<div class=\"row text-row right-row\" id=\"null-row\"><div class=\"col right-lnum col-sm-1\"></div> <div class=\"col line\"> <b>NULL</b></div></div>");

    $("#right-toadd").append(ele);

    for (var i = 0; i < doc2.length; i++) {
      var ele = $("<div class=\"row text-row right-row\"><div class=\"col right-lnum col-sm-1\">" + doc2[i][1] + "</div><div class=\"col line\">"+ doc2[i][0] +"</div></div>");
      ele.attr("id", "right-" + index + "-" + i);
      if (doc2[i][2] === 0 && i != 0) {
        $("#right-toadd").append("<br class='breaks'>");
        $("#right-toadd").append(ele);
      } else {
        $("#right-toadd").append(ele);
      }
    }
  }

  $("#tutorial-button").click(function () {
    $("#overlay").css("display", "block");
  });

  $("#overlay").click(function (e) {
    if (e.target !== this)
      return;
    $("#overlay").css("display", "none");
  });
}

