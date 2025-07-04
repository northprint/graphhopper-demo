FROM openjdk:17-slim

# GraphHopper version
ENV GRAPHHOPPER_VERSION=9.1

# Install wget and other dependencies
RUN apt-get update && \
    apt-get install -y wget && \
    rm -rf /var/lib/apt/lists/*

# Create graphhopper directory
WORKDIR /graphhopper

# Download GraphHopper
RUN wget -O graphhopper.jar \
    https://repo1.maven.org/maven2/com/graphhopper/graphhopper-web/${GRAPHHOPPER_VERSION}/graphhopper-web-${GRAPHHOPPER_VERSION}.jar

# Copy configuration
COPY config-demo.yml /graphhopper/config.yml

# Expose port
EXPOSE 8989

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget -q --tries=1 --spider http://localhost:8989/health || exit 1

# Run GraphHopper
ENTRYPOINT ["java", "-jar", "graphhopper.jar", "server"]
CMD ["config.yml"]