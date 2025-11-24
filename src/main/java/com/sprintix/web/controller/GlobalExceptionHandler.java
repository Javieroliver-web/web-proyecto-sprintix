package com.sprintix.web.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.servlet.ModelAndView;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(Exception.class)
    public ModelAndView handleException(Exception e, HttpServletRequest request) {
        logger.error("Error no controlado en {}: {}", request.getRequestURI(), e.getMessage(), e);
        
        ModelAndView mav = new ModelAndView("error");
        mav.addObject("errorMessage", "Ha ocurrido un error inesperado");
        mav.addObject("errorDetails", e.getMessage());
        mav.addObject("url", request.getRequestURI());
        mav.addObject("showDetails", false);
        
        return mav;
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ModelAndView handleValidationError(IllegalArgumentException e) {
        logger.warn("Error de validación: {}", e.getMessage());
        
        ModelAndView mav = new ModelAndView("error");
        mav.addObject("errorMessage", "Datos inválidos");
        mav.addObject("errorDetails", e.getMessage());
        mav.addObject("showDetails", true);
        
        return mav;
    }

    @ExceptionHandler(IllegalStateException.class)
    public ModelAndView handleSessionError(IllegalStateException e) {
        logger.warn("Error de sesión: {}", e.getMessage());
        
        ModelAndView mav = new ModelAndView("error");
        mav.addObject("errorMessage", "Sesión inválida o expirada");
        mav.addObject("errorDetails", "Por favor, inicia sesión nuevamente");
        mav.addObject("showLoginLink", true);
        
        return mav;
    }
}