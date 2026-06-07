package com.estudos.model;

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
@Document(collection = "simulados")
public class Simulado {

    @Id
    private String id;

    @NotNull(message = "O número é obrigatório")
    private Integer numero;

    // chave = número da questão (string), valor = alternativa correta (A-E)
    private Map<String, String> questoes = new LinkedHashMap<>();

    // disciplina por questão (opcional, texto livre). chave = número da questão.
    private Map<String, String> disciplinas = new LinkedHashMap<>();

    // conteúdo por questão (opcional, texto livre). chave = número da questão.
    private Map<String, String> conteudos = new LinkedHashMap<>();
}
