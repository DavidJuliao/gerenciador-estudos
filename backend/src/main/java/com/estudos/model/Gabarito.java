package com.estudos.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.LinkedHashMap;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "gabaritos")
public class Gabarito {

    @Id
    private String id;

    @NotNull(message = "O número é obrigatório")
    private Integer numero;

    @NotBlank(message = "A disciplina é obrigatória")
    private String disciplina;

    // Referência opcional ao conteúdo (id da collection conteudos).
    private String conteudoId;

    // chave = número da questão (como string), valor = alternativa correta (A-E)
    private Map<String, String> questoes = new LinkedHashMap<>();
}
