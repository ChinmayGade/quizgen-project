package com.quizgen.service;

import com.quizgen.model.User;
import com.quizgen.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    public Map<String, Object> register(String name, String email, String password, String role) {
        // Validate
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Name is required");
        }
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (password == null || password.length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters");
        }
        if (userRepository.existsByEmail(email.trim().toLowerCase())) {
            throw new IllegalArgumentException("Email already registered");
        }

        User.Role userRole;
        try {
            userRole = User.Role.valueOf(role.toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid role. Must be TEACHER or STUDENT");
        }

        // Create user
        User user = new User(
                name.trim(),
                email.trim().toLowerCase(),
                passwordEncoder.encode(password),
                userRole);
        userRepository.save(user);

        // Generate token
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());

        return buildResponse(token, user);
    }

    public Map<String, Object> login(String email, String password) {
        if (email == null || password == null) {
            throw new IllegalArgumentException("Email and password are required");
        }

        Optional<User> optionalUser = userRepository.findByEmail(email.trim().toLowerCase());
        if (optionalUser.isEmpty()) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        User user = optionalUser.get();
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());

        return buildResponse(token, user);
    }

    public Map<String, Object> getUserFromToken(String token) {
        if (!jwtUtil.isTokenValid(token)) {
            throw new IllegalArgumentException("Invalid or expired token");
        }

        Long userId = jwtUtil.getUserIdFromToken(token);
        Optional<User> optionalUser = userRepository.findById(userId);
        if (optionalUser.isEmpty()) {
            throw new IllegalArgumentException("User not found");
        }

        User user = optionalUser.get();
        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", user.getId());
        userMap.put("name", user.getName());
        userMap.put("email", user.getEmail());
        userMap.put("role", user.getRole().name());
        return userMap;
    }

    private Map<String, Object> buildResponse(String token, User user) {
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);

        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", user.getId());
        userMap.put("name", user.getName());
        userMap.put("email", user.getEmail());
        userMap.put("role", user.getRole().name());
        response.put("user", userMap);

        return response;
    }
}
