package com.shoestore.exception;

import org.springframework.http.HttpStatus;

/**
 * Ngoại lệ cơ sở CustomException cho toàn bộ nghiệp vụ trong hệ thống
 */
public class CustomException extends RuntimeException {

    private final HttpStatus status;

    public CustomException(String message) {
        super(message);
        this.status = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    public CustomException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
