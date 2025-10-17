var app = (function () {

    class Point {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
    }

    var stompClient = null;
    var drawingId = null; // nuevo campo

    // Dibuja un punto en el canvas
    var addPointToCanvas = function (point) {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = "#007bff";
        ctx.fill();
        ctx.stroke();
    };

    // Obtiene posición del clic
    var getMousePosition = function (evt) {
        var canvas = document.getElementById("canvas");
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };

    // Conecta al endpoint y se suscribe al tópico dinámico
    var connectAndSubscribe = function () {
        var dibujoId = $("#drawingId").val();
        if (!dibujoId) {
            alert("Por favor, ingrese un número de dibujo antes de conectarse.");
            return;
        }

        console.info('Connecting to WS...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);

            // Suscripción a puntos
            stompClient.subscribe('/topic/newpoint.' + dibujoId, function (eventBody) {
                var point = JSON.parse(eventBody.body);
                addPointToCanvas(point);
            });

            // Suscripción a polígonos
            stompClient.subscribe('/topic/newpolygon.' + dibujoId, function (eventBody) {
                var points = JSON.parse(eventBody.body);
                drawPolygon(points);
            });

            console.log("Suscrito a /topic/newpoint." + dibujoId + " y /topic/newpolygon." + dibujoId);
        });
    };

    var drawPolygon = function (points) {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");

        if (points.length < 3) return;

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (var i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = "rgba(0, 123, 255, 0.3)";
        ctx.fill();
        ctx.strokeStyle = "#007bff";
        ctx.stroke();

        console.log("Polígono dibujado con " + points.length + " puntos");
    };


    return {
        init: function () {
            console.info("Initializing application...");

            // evento de click del canvas
            var canvas = document.getElementById("canvas");
            canvas.addEventListener("click", function (evt) {
                var pos = getMousePosition(evt);
                app.publishPoint(pos.x, pos.y);
            });

            // botón "Conectarse"
            document.getElementById("connectBtn").addEventListener("click", function () {
                drawingId = document.getElementById("drawingId").value;
                if (drawingId.trim() === "") {
                    alert("Debe ingresar un ID de dibujo antes de conectarse.");
                    return;
                }
                connectAndSubscribe();
            });

            document.getElementById("sendPointBtn").addEventListener("click", function () {
                const x = parseInt(document.getElementById("x").value);
                const y = parseInt(document.getElementById("y").value);

                if (isNaN(x) || isNaN(y)) {
                    alert("Debes ingresar valores numéricos para X e Y.");
                    return;
                }

                app.publishPoint(x, y);
            });

        },

        publishPoint: function (px, py) {
            console.log("publishPoint() ejecutado con: ", px, py);
            var pt = new Point(px, py);
            var dibujoId = $("#drawingId").val();
            if (!dibujoId) {
                alert("Debe ingresar el número del dibujo antes de enviar puntos.");
                return;
            }

            console.info("Publishing point at (" + pt.x + "," + pt.y + ") to drawing " + dibujoId);
            addPointToCanvas(pt);

            if (stompClient) {
                stompClient.send("/app/newpoint." + dibujoId, {}, JSON.stringify(pt));
            } else {
                console.error("STOMP client not connected.");
            }
        },

        disconnect: function () {
            if (stompClient !== null) {
                stompClient.disconnect();
            }
            console.log("Disconnected");
        },

        connect: function () {
            connectAndSubscribe();
        }

    };

})();
