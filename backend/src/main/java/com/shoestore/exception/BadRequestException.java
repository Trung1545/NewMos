package com.shoestore.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Ngoại lệ khi dữ liệu yêu cầu không hợp lệ hoặc vi phạm nghiệp vụ (HTTP 400 Bad Request)
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class BadRequestException extends CustomException {

    public BadRequestException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}
