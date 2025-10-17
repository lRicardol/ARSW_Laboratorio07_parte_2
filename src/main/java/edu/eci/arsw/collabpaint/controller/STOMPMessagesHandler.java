package edu.eci.arsw.collabpaint.controller;

import edu.eci.arsw.collabpaint.model.Point;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Controller
public class STOMPMessagesHandler {

    @Autowired
    SimpMessagingTemplate msgt;

    // Cada dibujo tendrá su propia lista de puntos
    private final Map<String, List<Point>> drawings = new ConcurrentHashMap<>();

    @MessageMapping("/newpoint.{numdibujo}")
    public void handlePointEvent(Point pt, @DestinationVariable String numdibujo) throws Exception {
        System.out.println("Nuevo punto recibido en el servidor para dibujo " + numdibujo + ": " + pt);

        // Guarda el punto en la lista correspondiente
        drawings.putIfAbsent(numdibujo, Collections.synchronizedList(new ArrayList<>()));
        drawings.get(numdibujo).add(pt);

        // Reenvía el punto individual al tópico correspondiente
        msgt.convertAndSend("/topic/newpoint." + numdibujo, pt);

        // Si ya hay 4 o más puntos, construye y envía un polígono
        if (drawings.get(numdibujo).size() >= 4) {
            List<Point> polygonPoints = new ArrayList<>(drawings.get(numdibujo));
            msgt.convertAndSend("/topic/newpolygon." + numdibujo, polygonPoints);

            System.out.println("Polígono enviado para dibujo " + numdibujo + " con " + polygonPoints.size() + " puntos.");

            // Reinicia los puntos del dibujo
            drawings.get(numdibujo).clear();
        }
    }
}
