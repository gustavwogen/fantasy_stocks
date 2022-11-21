$(function() {
    $("#addMore").click(function(e) {
      e.preventDefault();
      $("#fieldList").append("<li>&nbsp;</li>");
      $("#fieldList").append("<li><input type='text' name='users[]' placeholder='User Name' class='form-control' required autofocus/></li>");
    });
  });

date.min = new Date().toISOString().split("T")[0];