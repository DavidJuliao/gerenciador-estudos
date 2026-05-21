package com.estudos.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "conteudos")
public class Conteudo {

    @Id
    private String id;

    @NotBlank(message = "A disciplina é obrigatória")
    private String disciplina;

    @NotBlank(message = "A descrição é obrigatória")
    private String descricao;

    @NotNull(message = "A prioridade é obrigatória")
    private Prioridade prioridade;

    // Define se este registro é um CONTEUDO (nível raiz) ou um SUBCONTEUDO
    // (filho de um conteúdo). Estrutura plana de 2 níveis: subconteúdo só
    // pode ter um CONTEUDO como pai.
    @NotNull(message = "O tipo é obrigatório")
    private TipoConteudo tipo = TipoConteudo.CONTEUDO;

    // Preenchido apenas quando tipo == SUBCONTEUDO. Referencia o id do
    // conteúdo pai. Para tipo == CONTEUDO deve ser null.
    private String conteudoPaiId;

    private LocalDate dataEstudada;

    // Mantém apenas a última data de estudo anterior (histórico de 1 nível
    // usado para desfazer um clique acidental no botão "Estudei").
    private LocalDate dataEstudadaAnterior;

    // Marca manual de "precisa revisar". Tem prioridade sobre dataEstudada
    // na ordenação da tela de Revisões. É zerado automaticamente quando o
    // conteúdo é marcado como estudado.
    private boolean marcado;

    private List<Questao> questoes = new ArrayList<>();
}
