package com.estudos.service;

import com.estudos.model.Gabarito;
import com.estudos.model.GabaritoHistorico;
import com.estudos.repository.GabaritoHistoricoRepository;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class GabaritoHistoricoService {

    private final GabaritoHistoricoRepository repository;
    private final GabaritoService gabaritoService;

    public GabaritoHistoricoService(GabaritoHistoricoRepository repository, GabaritoService gabaritoService) {
        this.repository = repository;
        this.gabaritoService = gabaritoService;
    }

    public List<GabaritoHistorico> listarPorGabarito(String gabaritoId) {
        return repository.findByGabaritoId(gabaritoId);
    }

    public GabaritoHistorico buscarPorId(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Histórico não encontrado com id: " + id));
    }

    public GabaritoHistorico criar(String gabaritoId, GabaritoHistorico historico) {
        historico.setId(null);
        historico.setGabaritoId(gabaritoId);
        corrigir(historico);
        return repository.save(historico);
    }

    public GabaritoHistorico atualizar(String id, GabaritoHistorico dados) {
        GabaritoHistorico existente = buscarPorId(id);
        existente.setDataResolucao(dados.getDataResolucao());
        existente.setRespostas(dados.getRespostas());
        existente.setObservacoes(dados.getObservacoes());
        existente.setAtencao(dados.getAtencao());
        corrigir(existente);
        return repository.save(existente);
    }

    public void excluir(String id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Histórico não encontrado com id: " + id);
        }
        repository.deleteById(id);
    }

    /**
     * Compara as respostas do histórico com o gabarito oficial e preenche
     * resultadoPorQuestao, acertos e totalQuestoes automaticamente.
     */
    private void corrigir(GabaritoHistorico h) {
        Gabarito gabarito = gabaritoService.buscarPorId(h.getGabaritoId());
        Map<String, String> oficiais = gabarito.getQuestoes() != null ? gabarito.getQuestoes() : Map.of();
        Map<String, String> respostas = h.getRespostas() != null ? h.getRespostas() : Map.of();

        Map<String, Boolean> resultado = new LinkedHashMap<>();
        int acertos = 0;
        for (Map.Entry<String, String> entry : oficiais.entrySet()) {
            String questao = entry.getKey();
            String correta = entry.getValue();
            String marcada = respostas.get(questao);
            boolean acertou = marcada != null && correta != null
                    && marcada.trim().equalsIgnoreCase(correta.trim());
            resultado.put(questao, acertou);
            if (acertou) {
                acertos++;
            }
        }
        h.setResultadoPorQuestao(resultado);
        h.setAcertos(acertos);
        h.setTotalQuestoes(oficiais.size());
    }
}
