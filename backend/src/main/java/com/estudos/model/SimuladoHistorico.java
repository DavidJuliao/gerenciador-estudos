package com.estudos.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "simulado_historicos")
public class SimuladoHistorico {

    @Id
    private String id;

    // Preenchido pelo backend a partir da URL; não vem no corpo da requisição.
    private String simuladoId;

    private LocalDate dataResolucao;

    // chave = número da questão, valor = alternativa marcada (A-E)
    private Map<String, String> respostas = new LinkedHashMap<>();

    // anotações livres por questão (opcional)
    private Map<String, String> observacoes = new LinkedHashMap<>();

    // questões marcadas como "atenção" (chute, dúvida etc.)
    private Map<String, Boolean> atencao = new LinkedHashMap<>();

    // calculado pelo backend: true = acertou a questão
    private Map<String, Boolean> resultadoPorQuestao = new LinkedHashMap<>();

    private int acertos;

    private int totalQuestoes;
}
