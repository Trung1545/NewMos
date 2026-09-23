package com.shoestore.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SizeCalculateResponse {

    private Integer recommendedSize;
    private String fitStatus;
    private String advice;
}
