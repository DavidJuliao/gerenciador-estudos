package com.estudos.model;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "registros_estudo")
public class RegistroEstudo {

    @Id
    private String id;

    @NotNull(message = "A data é obrigatória")
    private LocalDate data;

    @NotNull(message = "A duração é obrigatória")
    @Min(value = 1, message = "A duração deve ser maior que zero")
    private Integer duracaoMinutos;

    // Opcional: nome da disciplina (string livre, no mesmo modelo dos conteúdos).
    private String disciplina;
}
