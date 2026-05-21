package com.estudos.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "disciplinas")
public class Disciplina {

    @Id
    private String id;

    @NotBlank(message = "O nome da disciplina é obrigatório")
    private String nome;

    @NotNull(message = "O grupo é obrigatório")
    private Integer grupo;
}
