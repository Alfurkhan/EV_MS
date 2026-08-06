import type { Student } from "../types/student";

export const students: Student[] = [
    {
        id: 1,
        admissionNo: "STU001",
        name: "Rahul Sharma",
        email: "rahul@test.com",
        grade: "10",
        section: "A",
        phone: "9876543210",
        status: "ACTIVE",
    },
    {
        id: 2,
        admissionNo: "STU002",
        name: "Priya Singh",
        email: "priya@test.com",
        grade: "9",
        section: "B",
        phone: "9876543211",
        status: "ACTIVE",
    },
    {
        id: 3,
        admissionNo: "STU003",
        name: "Arjun Kumar",
        email: "arjun@test.com",
        grade: "8",
        section: "A",
        phone: "9876543212",
        status: "INACTIVE",
    },
];