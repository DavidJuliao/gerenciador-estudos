package com.estudos.service;

import com.estudos.model.Simulado;
import com.estudos.model.SimuladoHistorico;
import com.estudos.repository.SimuladoHistoricoRepository;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class SimuladoHistoricoService {

    private final SimuladoHistoricoRepository repository;
    private final SimuladoService simuladoService;

    public SimuladoHistoricoService(SimuladoHistoricoRepository repository, SimuladoService simuladoService) {
        this.repository = repository;
        this.simuladoService = simuladoService;
    }

    public List<SimuladoHistorico> listarPorSimulado(String simuladoId) {
        return repository.findBySimuladoId(simuladoId);
    }

    public SimuladoHistorico buscarPorId(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Histórico não encontrado com id: " + id));
    }

    public SimuladoHistorico criar(String simuladoId, SimuladoHistorico historico) {
        historico.setId(null);
        historico.setSimuladoId(simuladoId);
        corrigir(historico);
        return repository.save(historico);
    }

    public SimuladoHistorico atualizar(String id, SimuladoHistorico dados) {
        SimuladoHistorico existente = buscarPorId(id);
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
     * Compara as respostas do histórico com o gabarito do simulado e preenche
     * resultadoPorQuestao, acertos e totalQuestoes automaticamente.
     */
    private void corrigir(SimuladoHistorico h) {
        Simulado simulado = simuladoService.buscarPorId(h.getSimuladoId());
        Map<String, String> oficiais = simulado.getQuestoes() != null ? simulado.getQuestoes() : Map.of();
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
