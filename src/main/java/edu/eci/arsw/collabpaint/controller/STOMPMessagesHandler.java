package edu.eci.arsw.collabpaint.controller;

import edu.eci.arsw.collabpaint.model.Point;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class STOMPMessagesHandler {

    @Autowired
    SimpMessagingTemplate msgt;

    // Maneja tópicos dinámicos como /app/newpoint.{drawingId}
    @MessageMapping("/newpoint.{drawingId}")
    public void handlePointEvent(Point point, @DestinationVariable String drawingId) throws Exception {
        System.out.println("Nuevo punto recibido en dibujo " + drawingId + ": " + point);
        // Envía el punto al tópico correspondiente
        msgt.convertAndSend("/topic/newpoint." + drawingId, point);
    }
}
