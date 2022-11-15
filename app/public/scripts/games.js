$(function() {
    $("#addMore").click(function(e) {
      e.preventDefault();
      $("#fieldList").append("<li>&nbsp;</li>");
      $("#fieldList").append("<li><input type='text' name='users[]' placeholder='User Name' /></li>");
    });
  });
  

  