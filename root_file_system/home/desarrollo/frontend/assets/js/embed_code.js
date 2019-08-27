!(function() {
  try {
    var r = window,
      n = document,
      i = console;
    r.Overtok = r.Overtok || {
      call: function(e, t) {
        i.log(e, t);
        var o = n.body.appendChild(n.createElement("div"));
        (o.id = "overtok_wait"), (o.innerText = "Un momento. Cargando..");
        var a = o.style;
        (a.position = "absolute"),
          (a.left = e.pageX + "px"),
          (a.top = e.pageY + "px"),
          (a.zIndex = 9999),
          (a.background = "white"),
          (a.border = "solid 1px grey"),
          (a.padding = "5px"),
          (r._ovtk_c = { i: 1, a: t });
      }
    };
    var e = n.createElement("script");
    (e.type = "text/javascript"),
      (e.async = !0),
      (e.src =
        "https://assets.overtok-qa.com/partners/seccionamarilla/overtok.js"),
      n.body.appendChild(e);
  } catch (e) {
    i.log("overtok:", e);
  }
})();
