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
        if (!drawingId) {
            alert("Por favor ingrese un identificador de dibujo antes de conectarse.");
            return;
        }

        console.info('Connecting to WS...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);

            // suscripción dinámica
            let topic = `/topic/newpoint.${drawingId}`;
            console.log("Subscrito a: " + topic);

            stompClient.subscribe(topic, function (eventBody) {
                var point = JSON.parse(eventBody.body);
                addPointToCanvas(point);
            });
        });
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
        },

        publishPoint: function (px, py) {
            var pt = new Point(px, py);
            console.info("Publishing point at (" + pt.x + "," + pt.y + ")");

            addPointToCanvas(pt);

            if (stompClient && stompClient.connected && drawingId) {
                let topic = `/app/newpoint.${drawingId}`;
                stompClient.send(topic, {}, JSON.stringify(pt));
            } else {
                console.error("STOMP client not connected or drawingId missing.");
            }
        },

        disconnect: function () {
            if (stompClient !== null) {
                stompClient.disconnect();
            }
            console.log("Disconnected");
        }
    };

})();
