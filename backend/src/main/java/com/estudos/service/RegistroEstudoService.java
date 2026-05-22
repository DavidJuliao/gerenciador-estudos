package com.estudos.service;

import com.estudos.model.RegistroEstudo;
import com.estudos.repository.RegistroEstudoRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RegistroEstudoService {

    private final RegistroEstudoRepository repository;

    public RegistroEstudoService(RegistroEstudoRepository repository) {
        this.repository = repository;
    }

    public List<RegistroEstudo> listar() {
        return repository.findAll().stream()
                .sorted(Comparator.comparing(RegistroEstudo::getData).reversed())
                .collect(Collectors.toList());
    }

    public List<RegistroEstudo> listarPorIntervalo(LocalDate inicio, LocalDate fim) {
        return repository.findNoIntervalo(inicio, fim).stream()
                .sorted(Comparator.comparing(RegistroEstudo::getData))
                .collect(Collectors.toList());
    }

    public RegistroEstudo buscarPorId(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Registro não encontrado com id: " + id));
    }

    public RegistroEstudo salvar(RegistroEstudo registro) {
        return repository.save(registro);
    }

    public RegistroEstudo atualizar(String id, RegistroEstudo registro) {
        RegistroEstudo existente = buscarPorId(id);
        existente.setData(registro.getData());
        existente.setDuracaoMinutos(registro.getDuracaoMinutos());
        existente.setDisciplina(registro.getDisciplina());
        return repository.save(existente);
    }

    public void excluir(String id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Registro não encontrado com id: " + id);
        }
        repository.deleteById(id);
    }
}
