package com.shoestore.controller;

import com.shoestore.dto.request.SizeCalculateRequest;
import com.shoestore.dto.response.SizeCalculateResponse;
import com.shoestore.util.SizingCalculatorUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/size")
@Tag(name = "Size Calculator", description = "API tính toán size giày nhanh NewMos")
public class SizeCalculatorController {

    @PostMapping("/calculate")
    @Operation(summary = "Tính toán size giày chuẩn NewMos tức thì theo cm và form bàn chân")
    public ResponseEntity<SizeCalculateResponse> calculateSize(
            @Valid @RequestBody SizeCalculateRequest request
    ) {
        SizeCalculateResponse response = SizingCalculatorUtil.calculateNewMosSize(
                request.getFootLengthCm(),
                request.getFootShape(),
                request.getShoeModel()
        );
        return ResponseEntity.ok(response);
    }
}
