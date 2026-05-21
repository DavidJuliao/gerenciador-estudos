package com.estudos.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Questao {
    private String banca;
    private String link;
    private String ultimaQuestaoEstudada;
}
