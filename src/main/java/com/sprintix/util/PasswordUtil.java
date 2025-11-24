package com.sprintix.util;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;
import java.util.Arrays;
import java.util.Base64;

public class PasswordUtil {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    private static final int ITERATIONS = 10000;
    private static final int KEY_LENGTH = 256;

    public static String getSalt(int length) {
        StringBuilder returnValue = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            returnValue.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return new String(returnValue);
    }

    public static byte[] hash(char[] password, byte[] salt) {
        PBEKeySpec spec = new PBEKeySpec(password, salt, ITERATIONS, KEY_LENGTH);
        Arrays.fill(password, Character.MIN_VALUE);
        try {
            SecretKeyFactory skf = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA1");
            return skf.generateSecret(spec).getEncoded();
        } catch (NoSuchAlgorithmException | InvalidKeySpecException e) {
            throw new AssertionError("Error while hashing a password: " + e.getMessage(), e);
        } finally {
            spec.clearPassword();
        }
    }

    public static String generateSecurePassword(String password, String salt) {
        String returnValue = null;
        byte[] securePassword = hash(password.toCharArray(), salt.getBytes());
        returnValue = Base64.getEncoder().encodeToString(securePassword);
        return returnValue;
    }

    public static boolean verifyUserPassword(String providedPassword, String securedPassword, String salt) {
        boolean returnValue = false;
        
        // Intentamos dividir la contraseña guardada esperando el formato "salt:hash"
        String[] parts = securedPassword.split(":");
        
        if (parts.length == 2) {
            // CASO 1: Contraseña segura (Formato Correcto)
            String saltDb = parts[0];
            String hashDb = parts[1];
            
            // Generar hash con el salt extraído de la BD y la contraseña que escribió el usuario
            String newSecurePassword = generateSecurePassword(providedPassword, saltDb);
            
            // Comparar los hashes
            returnValue = newSecurePassword.equalsIgnoreCase(hashDb);
        } else {
            // CASO 2: FALLBACK (Contraseña antigua o Texto Plano)
            // Si no hay ':', asumimos que es texto plano (útil para desarrollo/pruebas)
            returnValue = providedPassword.equals(securedPassword);
        }
        
        return returnValue;
    }
}